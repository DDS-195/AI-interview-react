// 导入和写入前规范化业务数据，兼容旧记录但不为它们伪造缺失的评分结果。
function invalid(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

function text(value, name, max = 2000000, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim()) || value.length > max) {
    invalid(`${name}格式无效`)
  }
  return value
}

function date(value, name) {
  text(value, name, 100)
  if (!Number.isFinite(Date.parse(value))) {
    invalid(`${name}格式无效`)
  }
  return value
}

function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid('数据格式无效')
  }
}

function metadata(value) {
  const result = {}
  for (const key of [
    'topic',
    'topicId',
    'technicalVersion',
    'promptVersion',
    'questionPromptVersion',
    'model',
    'referenceAnswer'
  ]) {
    if (value[key] !== undefined) {
      result[key] = text(value[key], key, key === 'referenceAnswer' ? 10000 : 300)
    }
  }
  if (value.mode !== undefined) {
    if (!require('../data/topics').MODES.includes(value.mode)) {
      invalid('练习模式无效')
    }
    result.mode = value.mode
  }
  if (value.codeLanguage !== undefined) {
    if (!['javascript', 'typescript', 'html', 'css'].includes(value.codeLanguage)) {
      invalid('代码语言无效')
    }
    result.codeLanguage = value.codeLanguage
  }
  if (value.referenceStatus !== undefined) {
    if (!['verified', 'generated', 'grounded'].includes(value.referenceStatus)) {
      invalid('参考来源无效')
    }
    result.referenceStatus = value.referenceStatus
  }
  for (const key of ['suggestions', 'optionalPoints', 'uncertainties']) {
    if (value[key] !== undefined) {
      if (!Array.isArray(value[key]) || value[key].length > 3) {
        invalid(`${key}格式无效`)
      }
      result[key] = value[key].map((item) => text(item, key, 300))
    }
  }
  if (value.sources !== undefined) {
    if (!Array.isArray(value.sources) || value.sources.length > 5) {
      invalid('来源格式无效')
    }
    result.sources = value.sources.map((source) => {
      object(source)
      const url = text(source.url, '来源链接', 1000)
      try {
        if (new URL(url).protocol !== 'https:') {
          invalid('来源链接无效')
        }
      } catch {
        invalid('来源链接无效')
      }
      return { title: text(source.title, '来源标题', 200), url }
    })
  }
  if (value.knowledgeSnapshot !== undefined) {
    try {
      result.knowledgeSnapshot = require('./knowledge/snapshot').validateSnapshot(
        value.knowledgeSnapshot
      )
    } catch (error) {
      invalid(error.message)
    }
  }
  if (result.referenceStatus === 'grounded' && result.knowledgeSnapshot?.status !== 'grounded') {
    invalid('知识增强记录缺少固定依据')
  }
  return result
}

function question(value) {
  object(value)
  if (!['easy', 'medium', 'hard'].includes(value.difficulty)) {
    invalid('题目难度无效')
  }
  if (!['text', 'code'].includes(value.type)) {
    invalid('题目类型无效')
  }
  const extras = metadata(value)
  if (value.rubric !== undefined) {
    try {
      extras.rubric = require('./aiContract').rubric(value.rubric)
    } catch {
      invalid('评分要点无效')
    }
  }
  if (extras.referenceStatus === 'grounded') {
    if (extras.knowledgeSnapshot?.status !== 'grounded' || !extras.rubric) {
      invalid('知识增强题目缺少依据')
    }
    if (
      extras.knowledgeSnapshot.evidence.some(
        (item) => item.technicalVersion !== value.technicalVersion
      )
    ) {
      invalid('知识版本与题目不匹配')
    }
    try {
      extras.rubricSources = require('./knowledge/snapshot').validateBindings(
        value.rubricSources,
        extras.rubric.map((point) => point.id),
        extras.knowledgeSnapshot
      )
    } catch (error) {
      invalid(error.message)
    }
  }
  return {
    ...extras,
    id: text(value.id, '题目 ID', 200),
    categoryId: text(value.categoryId, '分类 ID', 100),
    title: text(value.title, '题目标题', 2000),
    content: text(value.content, '题目内容'),
    difficulty: value.difficulty,
    type: value.type
  }
}

function favorite(value) {
  object(value)
  return {
    questionId: text(value.questionId, '题目 ID', 200),
    addedAt: date(value.addedAt, '收藏时间')
  }
}

function history(value) {
  object(value)
  const record = {
    ...metadata(value),
    questionId: text(value.questionId, '题目 ID', 200),
    answer: text(value.answer, '回答', 2000000, true),
    submittedAt: date(value.submittedAt, '提交时间')
  }
  if (value.score !== undefined) {
    if (!Number.isFinite(value.score) || value.score < 0 || value.score > 100) {
      invalid('分数须为 0 到 100')
    }
    record.score = value.score
  }
  for (const key of ['correctAnswer', 'feedback']) {
    if (value[key] !== undefined) {
      record[key] = text(value[key], key, 2000000, true)
    }
  }
  if (value.criteria !== undefined) {
    if (!Array.isArray(value.criteria) || !value.criteria.length || value.criteria.length > 6) {
      invalid('评分细项无效')
    }
    record.criteria = value.criteria.map((item) => {
      object(item)
      if (
        !['met', 'partial', 'missed', 'incorrect'].includes(item.verdict) ||
        !Number.isFinite(item.points) ||
        !Number.isInteger(item.maxPoints) ||
        item.maxPoints < 1 ||
        item.maxPoints > 100 ||
        item.points < 0 ||
        item.points > item.maxPoints
      ) {
        invalid('评分细项无效')
      }
      const factor = item.verdict === 'met' ? 1 : item.verdict === 'partial' ? 0.5 : 0
      if (item.points !== item.maxPoints * factor) {
        invalid('评分细项分数不匹配')
      }
      const sourceIds =
        record.referenceStatus === 'grounded'
          ? require('./knowledge/snapshot').validateBindings(
              { [item.id]: item.sourceIds },
              [item.id],
              record.knowledgeSnapshot
            )[item.id]
          : undefined
      return {
        id: text(item.id, '评分编号', 40),
        description: text(item.description, '必要要求', 180),
        maxPoints: item.maxPoints,
        points: item.points,
        verdict: item.verdict,
        evidence: text(item.evidence, '评分证据', 2000, true),
        explanation: text(item.explanation, '评分说明', 300),
        ...(sourceIds ? { sourceIds } : {})
      }
    })
    if (
      new Set(record.criteria.map((x) => x.id)).size !== record.criteria.length ||
      record.criteria.reduce((sum, x) => sum + x.maxPoints, 0) !== 100 ||
      Math.round(record.criteria.reduce((sum, x) => sum + x.points, 0)) !== record.score
    ) {
      invalid('总分与评分细项不匹配')
    }
  }
  if (value.questionSnapshot !== undefined) {
    record.questionSnapshot = question(value.questionSnapshot)
    if (record.questionSnapshot.id !== record.questionId) {
      invalid('历史题目快照不匹配')
    }
  }
  return record
}

function snapshot(value) {
  object(value)
  const result = {}
  for (const [key, validate, idKey] of [
    ['questions', question, 'id'],
    ['favorites', favorite, 'questionId'],
    ['history', history, 'submittedAt']
  ]) {
    if (!Array.isArray(value[key])) {
      invalid(`${key}须为数组`)
    }
    const items = value[key].map(validate)
    result[key] = [...new Map(items.map((item) => [item[idKey], item])).values()]
  }
  result.history.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
  if (value.reviewMarks !== undefined) {
    if (!Array.isArray(value.reviewMarks)) {
      invalid('复习标记须为数组')
    }
    result.reviewMarks = [
      ...new Map(
        value.reviewMarks.map((item) => {
          object(item)
          if (!['pending', 'completed'].includes(item.status)) {
            invalid('复习状态无效')
          }
          const mark = {
            questionId: text(item.questionId, '题目 ID', 200),
            status: item.status,
            baselineSubmission:
              item.baselineSubmission === null
                ? null
                : date(item.baselineSubmission, '复习基准提交时间'),
            updatedAt: date(item.updatedAt, '复习更新时间')
          }
          return [mark.questionId, mark]
        })
      ).values()
    ]
  }
  return result
}

module.exports = { question, favorite, history, snapshot, text }

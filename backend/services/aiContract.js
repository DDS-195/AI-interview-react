// 校验模型输出并汇总必要项得分；结构合法不等于技术判断已经正确。
const { createHash } = require('node:crypto')

function fail(message, status = 502) {
  const error = new Error(message)
  error.status = status
  throw error
}
function string(value, name, max = 4000, status = 502) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    fail(`${name}格式无效`, status)
  }
  return value.trim()
}
function strings(value, name, maxItems = 2, maxLength = 160) {
  if (!Array.isArray(value) || value.length > maxItems) {
    fail(`${name}格式无效`)
  }
  return value.map((item) => string(item, name, maxLength))
}
function rubric(value) {
  if (!Array.isArray(value) || !value.length || value.length > 6) {
    fail('评分要点格式无效')
  }
  const result = value.map((item) => {
    if (!item || !Number.isInteger(item.weight) || item.weight < 1 || item.weight > 100) {
      fail('评分权重无效')
    }
    return {
      id: string(item.id, '要点编号', 40),
      description: string(item.description, '必要要求', 180),
      weight: item.weight,
      expected: string(item.expected, '可接受的答案要点', 600)
    }
  })
  if (
    new Set(result.map((x) => x.id)).size !== result.length ||
    result.reduce((sum, x) => sum + x.weight, 0) !== 100
  ) {
    fail('评分要点编号须唯一，权重之和须为100')
  }
  return result
}
function parseJSON(value) {
  try {
    return JSON.parse(string(value, '模型结果', 30000))
  } catch (error) {
    if (error.status) {
      throw error
    }
    fail('AI 返回的 JSON 格式无效，请重试')
  }
}
const titleKey = (value) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]/gu, '')

// 现有正文指纹会忽略空白；以后调整规则时要同步迁移数据库已有指纹。
const contentKey = (value) =>
  createHash('sha256').update(value.normalize('NFKC').replace(/\s/gu, '')).digest('hex')

// 当前证据比较会规范化字符并忽略空白，不能当作严格的原文连续片段验证。
const comparable = (value) => value.normalize('NFKC').replace(/\s/gu, '')

// 模型负责逐项判定，程序负责权重计算；uncertain 或非法证据不产生有效成绩。
function grade(value, question, answer) {
  if (
    !value ||
    !Array.isArray(value.criteria) ||
    value.criteria.length !== question.rubric.length
  ) {
    fail('AI 评分要点不完整，请重试')
  }
  if ('score' in value && (!Number.isFinite(value.score) || value.score < 0 || value.score > 100)) {
    fail('AI 分数越界，请重试')
  }
  const ids = new Set()
  const criteria = question.rubric.map((point) => {
    const item = value.criteria.find((x) => x?.id === point.id)
    if (
      !item ||
      ids.has(item.id) ||
      !['met', 'partial', 'missed', 'incorrect'].includes(item.verdict)
    ) {
      fail('AI 评分要点无效或无法确定，请重试')
    }
    ids.add(item.id)
    if (typeof item.evidence !== 'string' || item.evidence.length > 2000) {
      fail('评分证据格式无效')
    }
    const evidence = item.evidence.trim()
    if (
      (item.verdict !== 'missed' && !evidence) ||
      (evidence && !comparable(answer).includes(comparable(evidence)))
    ) {
      fail('评分证据不是回答原文，请重试')
    }
    const explanation = string(item.explanation, '评分说明', 300)
    const points =
      point.weight * (item.verdict === 'met' ? 1 : item.verdict === 'partial' ? 0.5 : 0)
    let sourceIds
    if (question.referenceStatus === 'grounded') {
      const allowed = question.rubricSources?.[point.id] || []
      if (
        !Array.isArray(item.sourceIds) ||
        !item.sourceIds.length ||
        item.sourceIds.length > 3 ||
        item.sourceIds.some((id) => !allowed.includes(id))
      ) {
        fail('评分知识引用与本题固定依据不匹配')
      }
      sourceIds = [...new Set(item.sourceIds)]
    }
    return {
      id: point.id,
      description: point.description,
      maxPoints: point.weight,
      points,
      verdict: item.verdict,
      evidence,
      explanation,
      ...(sourceIds ? { sourceIds } : {})
    }
  })
  const suggestions = strings(value.suggestions, '改进建议', 2, 160)
  const uncertainties = strings(value.uncertainties, '待核对事项', 3, 160)
  const score = Math.round(criteria.reduce((sum, item) => sum + item.points, 0))
  const met = criteria.filter((x) => x.verdict === 'met').length
  const partial = criteria.filter((x) => x.verdict === 'partial').length
  return {
    score,
    criteria,
    suggestions,
    uncertainties,
    feedback: `本题共有 ${criteria.length} 项必要要求：满足 ${met} 项，部分满足 ${partial} 项，未满足 ${criteria.length - met - partial} 项。总分由各项得分相加，可选拓展不扣分。`,
    correctAnswer: question.referenceAnswer,
    referenceStatus: question.referenceStatus || 'generated',
    sources: question.sources || [],
    technicalVersion: question.technicalVersion,
    topic: question.topic,
    topicId: question.topicId,
    mode: question.mode,
    codeLanguage: question.codeLanguage,
    questionPromptVersion: question.promptVersion,
    ...(question.knowledgeSnapshot ? { knowledgeSnapshot: question.knowledgeSnapshot } : {})
  }
}

// 仅提取 JSON 字符串字段的已完整解码部分，避免把 JSON 和隐藏评分要点展示给用户。
function partialString(json, key) {
  const match = new RegExp(`"${key}"\\s*:\\s*"`).exec(json)
  if (!match) {
    return ''
  }
  const start = match.index + match[0].length
  let end = start
  for (let i = start; i < json.length; i++) {
    if (json[i] === '"') {
      end = i
      break
    }
    if (json[i] === '\\') {
      if (i + 1 >= json.length) {
        break
      }
      if (json[i + 1] === 'u') {
        if (i + 5 >= json.length) {
          break
        }
        i += 5
      } else {
        i++
      }
    }
    end = i + 1
  }
  try {
    return JSON.parse('"' + json.slice(start, end) + '"').replace(/[\uD800-\uDBFF]$/, '')
  } catch {
    return ''
  }
}
module.exports = {
  fail,
  string,
  strings,
  rubric,
  parseJSON,
  titleKey,
  contentKey,
  grade,
  partialString
}

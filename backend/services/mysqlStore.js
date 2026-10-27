// 训练数据仓储：参数化 SQL、事务与行锁负责一致性，模型调用不进入数据库事务。
const { createPool, initializeSchema, transaction } = require('../database/mysql')
const { mysqlConfig } = require('../database/config')
const { titleKey, contentKey } = require('./aiContract')
const { snapshot } = require('./dataValidation')
const { createHash } = require('node:crypto')
const learning = require('./learningRepository')

const questionFields = ['id', 'categoryId', 'title', 'content', 'difficulty', 'type']
const historyFields = ['submittedAt', 'questionId', 'answer', 'score', 'correctAnswer', 'feedback']
const extras = (item, fields) =>
  JSON.stringify(Object.fromEntries(Object.entries(item).filter(([key]) => !fields.includes(key))))
const utcDate = (value) => new Date(value).toISOString().slice(0, 23).replace('T', ' ')
const query = async (connection, sql, values = []) => (await connection.execute(sql, values))[0]
const conflict = (message) => Object.assign(new Error(message), { status: 409 })
// 标题先沿用既有规范化规则，再存为固定长度哈希，兼容中文和长标题索引。
const titleHash = (value) => createHash('sha256').update(titleKey(value)).digest('hex')

function unpack(row) {
  if (!row) {
    return null
  }
  const { details, ...base } = row
  for (const key of [
    'rowId',
    'titleKey',
    'contentKey',
    'topic',
    'submittedOrderAt',
    'addedOrderAt'
  ]) {
    delete base[key]
  }
  const result = {
    ...base,
    ...(details ? (typeof details === 'string' ? JSON.parse(details) : details) : {})
  }
  for (const key of ['score', 'correctAnswer', 'feedback']) {
    if (result[key] === null) {
      delete result[key]
    }
  }
  return result
}

async function counts(connection) {
  const [row] = await query(
    connection,
    `SELECT
    (SELECT COUNT(*) FROM questions) AS questions,
    (SELECT COUNT(*) FROM favorites) AS favorites,
    (SELECT COUNT(*) FROM history) AS history`
  )
  return row
}
async function summary(connection) {
  return {
    counts: await counts(connection),
    favorites: await query(
      connection,
      'SELECT questionId,addedAt FROM favorites ORDER BY addedOrderAt DESC,rowId DESC'
    )
  }
}
async function requireQuestion(connection, id) {
  const rows = await query(connection, 'SELECT id FROM questions WHERE id=? FOR UPDATE', [id])
  if (!rows.length) {
    throw Object.assign(new Error('题目尚未保存，请重试'), { status: 404 })
  }
}
async function lockCategory(connection, category) {
  await query(
    connection,
    'INSERT INTO generation_locks (categoryId) VALUES (?) ON DUPLICATE KEY UPDATE categoryId=categoryId',
    [category]
  )
  await query(connection, 'SELECT categoryId FROM generation_locks WHERE categoryId=? FOR UPDATE', [
    category
  ])
}
async function duplicate(connection, category, title, content) {
  const rows = await query(
    connection,
    'SELECT id FROM questions WHERE categoryId=? AND (titleKey=? OR contentKey=?) LIMIT 1',
    [category, titleHash(title), contentKey(content)]
  )
  return Boolean(rows.length)
}
async function insertQuestion(connection, question, policy = 'insert') {
  const suffix =
    policy === 'update'
      ? ' AS incoming ON DUPLICATE KEY UPDATE categoryId=incoming.categoryId,' +
        'title=incoming.title,content=incoming.content,difficulty=incoming.difficulty,' +
        'type=incoming.type,details=incoming.details,titleKey=incoming.titleKey,' +
        'contentKey=incoming.contentKey'
      : policy === 'preserve'
        ? ' ON DUPLICATE KEY UPDATE id=id'
        : ''
  await query(
    connection,
    'INSERT INTO questions (id,categoryId,title,content,difficulty,type,details,titleKey,' +
      'contentKey) VALUES (?,?,?,?,?,?,?,?,?)' +
      suffix,
    [
      ...questionFields.map((key) => question[key]),
      extras(question, questionFields),
      titleHash(question.title),
      contentKey(question.content)
    ]
  )
}
async function insertHistory(connection, record, preserve = false) {
  await query(
    connection,
    'INSERT INTO history (submittedAt,submittedOrderAt,questionId,answer,score,correctAnswer,' +
      'feedback,details) VALUES (?,?,?,?,?,?,?,?)' +
      (preserve ? ' ON DUPLICATE KEY UPDATE submittedAt=submittedAt' : ''),
    [
      record.submittedAt,
      utcDate(record.submittedAt),
      record.questionId,
      record.answer,
      record.score ?? null,
      record.correctAnswer ?? null,
      record.feedback ?? null,
      extras(record, historyFields)
    ]
  )
}
async function insertData(connection, data) {
  for (const category of [
    ...new Set(data.questions.map((question) => question.categoryId))
  ].sort()) {
    await lockCategory(connection, category)
  }
  for (const question of data.questions) {
    await insertQuestion(connection, question, 'preserve')
  }
  for (const id of [
    ...new Set(
      [...data.favorites, ...data.history, ...(data.reviewMarks || [])].map(
        (record) => record.questionId
      )
    )
  ].sort()) {
    await requireQuestion(connection, id)
  }
  for (const favorite of data.favorites) {
    await query(
      connection,
      'INSERT INTO favorites (questionId,addedAt,addedOrderAt) VALUES (?,?,?) ON DUPLICATE KEY ' +
        'UPDATE questionId=questionId',
      [favorite.questionId, favorite.addedAt, utcDate(favorite.addedAt)]
    )
  }
  for (const record of data.history) {
    await insertHistory(connection, record, true)
  }
  for (const mark of data.reviewMarks || []) {
    await query(
      connection,
      'INSERT INTO review_marks (questionId,status,baselineSubmission,updatedAt) VALUES (?,?,?,' +
        '?) AS incoming ON DUPLICATE KEY UPDATE status=incoming.status,' +
        'baselineSubmission=incoming.baselineSubmission,updatedAt=incoming.updatedAt',
      [mark.questionId, mark.status, mark.baselineSubmission, utcDate(mark.updatedAt)]
    )
  }
}
async function list(connection, collection, requestedPage, pageSize) {
  const total = (await counts(connection))[collection]
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / pageSize)))
  const isHistory = collection === 'history'
  const fields = isHistory
    ? 'h.questionId,h.submittedAt,h.score,LEFT(h.answer,160) AS preview'
    : 'h.questionId,h.addedAt,LEFT(q.content,160) AS preview'
  const order = isHistory ? 'h.submittedOrderAt' : 'h.addedOrderAt'
  const rows = await query(
    connection,
    `SELECT ${fields},q.id AS qid,q.title,q.categoryId FROM ${collection} h LEFT JOIN questions q ON q.id=h.questionId ORDER BY ${order} DESC,h.rowId DESC LIMIT ? OFFSET ?`,
    [pageSize, (page - 1) * pageSize]
  )
  return {
    items: rows.map(({ qid, title, categoryId, ...item }) => ({
      ...unpack(item),
      question: qid ? { id: qid, title, categoryId } : null
    })),
    total,
    page,
    pageSize,
    distribution: await query(
      connection,
      `SELECT q.categoryId,COUNT(*) AS value FROM ${collection} h JOIN questions q ON q.id=h.questionId GROUP BY q.categoryId ORDER BY value DESC,q.categoryId`
    )
  }
}

module.exports = function createMysqlStore(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('MySQL存储配置须为对象，不再接受本地文件路径')
  }
  const config = mysqlConfig(options)
  const pool = createPool(config)
  let initialized = false
  let initializing
  let closed = false
  async function ready() {
    if (closed) {
      throw new Error('MySQL连接池已关闭')
    }
    if (initialized) {
      return
    }
    if (!initializing) {
      initializing = initializeSchema(pool)
        .then(() => {
          initialized = true
        })
        .finally(() => {
          initializing = undefined
        })
    }
    await initializing
  }
  const run =
    (operation) =>
    async (...args) => {
      try {
        await ready()
        return await operation(...args)
      } catch (cause) {
        if (cause.status) {
          throw cause
        }
        const error = new Error('MySQL数据服务暂不可用，请检查服务状态与数据库配置', { cause })
        error.status = 503
        throw error
      }
    }
  // Store 的写入和关联读取在同一事务连接内完成，不把网络模型请求放进锁内。
  const atomic = (operation) =>
    run((...args) => transaction(pool, (connection) => operation(connection, ...args)))
  return {
    databaseName: config.database,
    knowledge: require('./knowledge/repository')({ pool, run, atomic }),
    summary: atomic(summary),
    listHistory: atomic((connection, page, size) => list(connection, 'history', page, size)),
    listFavorites: atomic((connection, page, size) => list(connection, 'favorites', page, size)),
    listQuestions: atomic((connection, filters, page, size) =>
      learning.list(connection, filters, page, size)
    ),
    listReviews: atomic((connection, filters, page, size) =>
      learning.list(connection, filters, page, size, true)
    ),
    learningOverview: atomic(learning.overview),
    trainingContext: atomic(learning.trainingContext),
    markReview: atomic(async (connection, id, status) => {
      await learning.markReview(connection, id, status)
      return { counts: await counts(connection) }
    }),
    getQuestion: run(async (id) =>
      unpack((await query(pool, 'SELECT * FROM questions WHERE id=?', [id]))[0])
    ),
    // 优先返回作答时的题目快照；没有快照的旧记录才读取现有题目。
    historyDetail: atomic(async (connection, id) => {
      const record = unpack(
        (await query(connection, 'SELECT * FROM history WHERE submittedAt=?', [id]))[0]
      )
      return record
        ? {
            record,
            question:
              record.questionSnapshot ||
              unpack(
                (
                  await query(connection, 'SELECT * FROM questions WHERE id=?', [record.questionId])
                )[0]
              )
          }
        : null
    }),
    generationContext: atomic(async (connection, category) => ({
      recent: await query(
        connection,
        'SELECT title,difficulty,topic FROM questions WHERE categoryId=? ORDER BY rowId DESC LIMIT 30',
        [category]
      ),
      topics: await query(
        connection,
        'SELECT topic,COUNT(*) AS count FROM questions WHERE categoryId=? GROUP BY topic',
        [category]
      ),
      difficulties: Object.fromEntries(
        (
          await query(
            connection,
            'SELECT difficulty,COUNT(*) AS count FROM questions WHERE categoryId=? GROUP BY difficulty',
            [category]
          )
        ).map((item) => [item.difficulty, item.count])
      )
    })),
    isDuplicateQuestion: run((category, title, content) =>
      duplicate(pool, category, title, content)
    ),
    // 按分类串行化查重与写入，防止不同连接同时通过重复检查。
    putGeneratedQuestion: atomic(async (connection, question) => {
      await lockCategory(connection, question.categoryId)
      if (await duplicate(connection, question.categoryId, question.title, question.content)) {
        throw conflict('题目与已保存题目重复')
      }
      try {
        await insertQuestion(connection, question)
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw conflict('题目已保存')
        }
        throw error
      }
      return { counts: await counts(connection) }
    }),
    putQuestion: atomic(async (connection, question) => {
      await lockCategory(connection, question.categoryId)
      await insertQuestion(connection, question, 'update')
      return { counts: await counts(connection) }
    }),
    toggleFavorite: atomic(async (connection, id) => {
      await requireQuestion(connection, id)
      const removed = await query(connection, 'DELETE FROM favorites WHERE questionId=?', [id])
      if (removed.affectedRows) {
        return { counts: await counts(connection), removedFavoriteId: id }
      }
      const favorite = { questionId: id, addedAt: new Date().toISOString() }
      await query(
        connection,
        'INSERT INTO favorites (questionId,addedAt,addedOrderAt) VALUES (?,?,?)',
        [id, favorite.addedAt, utcDate(favorite.addedAt)]
      )
      return { counts: await counts(connection), favorite }
    }),
    deleteFavorite: atomic(async (connection, id) => {
      await query(connection, 'DELETE FROM favorites WHERE questionId=?', [id])
      return { counts: await counts(connection), removedFavoriteId: id }
    }),
    clearFavorites: atomic(async (connection) => {
      await query(connection, 'DELETE FROM favorites')
      return { counts: await counts(connection), clearFavorites: true }
    }),
    addHistory: atomic(async (connection, record) => {
      await requireQuestion(connection, record.questionId)
      try {
        await insertHistory(connection, record)
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw conflict('该答题记录已保存')
        }
        throw error
      }
      return { counts: await counts(connection) }
    }),
    deleteHistory: atomic(async (connection, id) => {
      await query(connection, 'DELETE FROM history WHERE submittedAt=?', [id])
      return { counts: await counts(connection) }
    }),
    clearHistory: atomic(async (connection) => {
      await query(connection, 'DELETE FROM history')
      return { counts: await counts(connection) }
    }),
    importData: atomic(async (connection, data) => {
      await insertData(connection, snapshot(data))
      return summary(connection)
    }),
    exportData: atomic(async (connection) => {
      const data = {
        questions: (await query(connection, 'SELECT * FROM questions ORDER BY rowId')).map(unpack),
        favorites: await query(
          connection,
          'SELECT questionId,addedAt FROM favorites ORDER BY rowId'
        ),
        history: (
          await query(connection, 'SELECT * FROM history ORDER BY submittedOrderAt DESC,rowId DESC')
        ).map(unpack)
      }
      const marks = await query(
        connection,
        'SELECT questionId,status,baselineSubmission,updatedAt FROM review_marks ORDER BY questionId'
      )
      if (marks.length) {
        data.reviewMarks = marks.map((mark) => ({
          ...mark,
          updatedAt: new Date(mark.updatedAt.replace(' ', 'T') + 'Z').toISOString()
        }))
      }
      return data
    }),
    migrationStatus: run(
      async (name) =>
        (await query(pool, 'SELECT value FROM metadata WHERE name=?', [name]))[0]?.value === 'done'
    ),
    migrateData: atomic(async (connection, data, name) => {
      await query(
        connection,
        "INSERT INTO metadata (name,value) VALUES (?,'pending') ON DUPLICATE KEY UPDATE name=name",
        [name]
      )
      const [marker] = await query(
        connection,
        'SELECT value FROM metadata WHERE name=? FOR UPDATE',
        [name]
      )
      if (marker.value === 'done') {
        return { alreadyMigrated: true, counts: await counts(connection) }
      }
      await insertData(connection, snapshot(data))
      await query(connection, "UPDATE metadata SET value='done' WHERE name=?", [name])
      return { alreadyMigrated: false, counts: await counts(connection) }
    }),
    close: async () => {
      if (closed) {
        return
      }
      closed = true
      try {
        if (initializing) {
          await initializing
        }
      } finally {
        await pool.end()
      }
    }
  }
}

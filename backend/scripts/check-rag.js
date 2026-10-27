// 用临时库验证真实本地检索；只有传入 --ai 才额外调用生成和评分模型。
require('dotenv').config({ path: __dirname + '/../.env', quiet: true })
const assert = require('node:assert/strict')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { createKnowledgeService } = require('../services/knowledge/service')
const { knowledgeConfig } = require('../services/knowledge/config')
const { readKnowledge } = require('../services/knowledge/markdown')
const { validateInput, versionFor } = require('../services/questionPlan')
const { generateQuestion } = require('../services/questionFlow')
const { evaluateAnswer } = require('../services/evaluationFlow')
async function main() {
  const database = await createTemporaryDatabase('quality')
  const config = knowledgeConfig({ RAG_MODE: 'prefer' })
  const service = createKnowledgeService(database.store.knowledge, { config })
  try {
    for (const note of await readKnowledge()) {
      await service.importDocument(note)
    }
    for (let i = 0; i < 100; i++) {
      const result = await service.indexOnce()
      if (!result.processed) {
        break
      }
    }
    const status = await service.status()
    assert.equal(status.ready, true)
    assert.equal(status.pending, 0)
    const cases = [
      ['react:effects', '当依赖改变时，旧连接何时撤销？', 'Effect 的更新顺序'],
      ['vue:computed', '派生值重复读取为什么不必重新求值？', 'computed 与缓存'],
      [
        'javascript:promise-all',
        '多个异步操作完成先后不同，数组返回值如何排列？',
        'Promise.all 的结果顺序'
      ],
      ['network:cache', '响应头要求复用前验证，是否仍允许保存响应？', 'no-cache 与 no-store'],
      ['vue:pinia', '直接解构 store 为什么页面不跟着值变化？', 'Pinia 状态与解构响应式'],
      [
        'typescript:satisfies',
        '既要检查对象形状又想保留字面量推断怎么办？',
        'satisfies 保留推断结果'
      ],
      [
        'html-css:dialog-popover',
        'show 和 showModal 打开对话框有什么交互区别？',
        'dialog 的模态与非模态打开'
      ],
      ['nodejs:streams', '写入速度高于消费速度时怎么防止内存持续增长？', '流的背压与 pipeline'],
      ['security:csrf', '浏览器自动带上登录凭据的跨站请求怎么约束？', 'CSRF 与请求来源校验'],
      [
        'web-components:shadow-styles',
        '组件内部样式能否隔离，以及还能如何对外调整外观？',
        'Shadow DOM 的样式边界'
      ],
      ['desktop:ipc', '网页和主进程怎样通信才能避免暴露任意系统能力？', 'Electron IPC 的最小接口']
    ]
    const results = []
    for (const [topicId, query, expected] of cases) {
      const categoryId = topicId.split(':')[0]
      const retrieved = await service.retrieve({
        categoryId,
        topicId,
        query,
        technicalVersion: versionFor(categoryId, topicId),
        mode: 'theory'
      })
      assert.equal(retrieved.method, 'semantic')
      assert.ok(
        retrieved.evidence.some((item) => item.title === expected),
        expected
      )
      results.push({
        topicId,
        method: retrieved.method,
        sources: retrieved.evidence.map((item) => item.title)
      })
    }
    if (process.argv.includes('--ai')) {
      const question = await generateQuestion(
        database.store,
        validateInput({
          category: 'vue',
          topicId: 'vue:pinia',
          mode: 'theory',
          difficulty: 'easy'
        }),
        { knowledgeService: service }
      )
      assert.equal(question.referenceStatus, 'grounded')
      const answer = question.referenceAnswer
      const evaluation = await evaluateAnswer(database.store, { questionId: question.id, answer })
      assert.equal(evaluation.referenceStatus, 'grounded')
      assert.ok(evaluation.criteria.every((item) => item.sourceIds.length))
      const history = await database.store.historyDetail(evaluation.submittedAt)
      assert.deepEqual(history.question.knowledgeSnapshot, question.knowledgeSnapshot)
      results.push({
        generatedTitle: question.title,
        contentLength: Array.from(question.content).length,
        rubricPoints: question.rubric.length,
        score: evaluation.score
      })
    }
    console.log(
      JSON.stringify(
        {
          model: config.model,
          revision: config.revision,
          documents: status.documents,
          indexed: status.indexed,
          results
        },
        null,
        2
      )
    )
  } finally {
    await service.close()
    await database.close()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})

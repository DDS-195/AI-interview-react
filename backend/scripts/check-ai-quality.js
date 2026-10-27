// 显式调用真实模型的质量检查，会消耗额度；样例通过率不等于重复评分稳定性。
// 手动运行才调用真实模型；普通 npm test 使用模拟响应，不消耗额度。
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true })
const fs = require('node:fs/promises')
const path = require('node:path')
const express = require('express')
const axios = require('axios')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { questions, cases } = require('../test/fixtures/grading')
const { QUESTION_PROMPT_VERSION } = require('../prompts/questionPrompts')
const { EVALUATION_PROMPT_VERSION } = require('../prompts/evaluationPrompts')
const args = process.argv.slice(2)
const outputIndex = args.indexOf('--output')
const samples = args.includes('--generation-only') ? [] : cases
let modelCalls = 0
axios.interceptors.request.use((config) => {
  if (++modelCalls > 48) {
    throw new Error('达到本次质量检查的调用上限')
  }
  return config
})
async function main() {
  const database = await createTemporaryDatabase('quality')
  const store = database.store
  const app = express()
  app.locals.dataStore = store
  app.use(express.json())
  app.use('/api/ai', require('../routes/evaluation'))
  app.use('/api/ai', require('../routes/questions'))
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = 'http://127.0.0.1:' + server.address().port + '/api/ai'
  const result = {
    startedAt: new Date().toISOString(),
    questionPromptVersion: QUESTION_PROMPT_VERSION,
    evaluationPromptVersion: EVALUATION_PROMPT_VERSION,
    mode: 'isolated synthetic data',
    evaluations: [],
    generations: []
  }
  const save = async () => {
    if (outputIndex !== -1) {
      await fs.writeFile(path.resolve(args[outputIndex + 1]), JSON.stringify(result, null, 2))
    }
  }
  try {
    for (const q of questions) {
      await store.putQuestion(q)
    }
    for (const sample of samples) {
      const started = Date.now()
      try {
        const response = await fetch(base + '/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: sample.questionId, answer: sample.answer }),
          signal: AbortSignal.timeout(95000)
        })
        const evaluation = await response.json()
        const passed =
          response.ok &&
          evaluation.score >= sample.expectedRange[0] &&
          evaluation.score <= sample.expectedRange[1]
        result.evaluations.push({
          ...sample,
          status: response.status,
          passed,
          evaluation,
          elapsedMs: Date.now() - started
        })
        console.log(
          JSON.stringify({
            case: sample.id,
            status: response.status,
            score: evaluation.score,
            passed
          })
        )
      } catch (error) {
        result.evaluations.push({ ...sample, passed: false, error: error.message })
        console.log(JSON.stringify({ case: sample.id, error: error.message }))
      }
      await save()
    }
    // 覆盖真实流式生成；服务端只有通过检查的题目才进入独立数据库。
    for (const category of ['react', 'scenario', 'coding', 'coding']) {
      const started = Date.now()
      try {
        const response = await fetch(base + '/generate-question-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category }),
          signal: AbortSignal.timeout(95000)
        })
        const text = await response.text()
        const events = text
          .split('\n')
          .filter((x) => x.startsWith('data: '))
          .map((x) => JSON.parse(x.slice(6)))
        const final = events.find((x) => x.done)
        result.generations.push({
          category,
          passed: !!final,
          question: final?.question,
          error: events.find((x) => x.error)?.error,
          elapsedMs: Date.now() - started
        })
        console.log(JSON.stringify({ generation: category, passed: !!final, topic: final?.topic }))
      } catch (error) {
        result.generations.push({ category, passed: false, error: error.message })
      }
      await save()
    }
    result.finishedAt = new Date().toISOString()
    result.modelCalls = modelCalls
    result.summary = {
      evaluationsPassed: result.evaluations.filter((x) => x.passed).length,
      evaluationsTotal: samples.length,
      generationsPassed: result.generations.filter((x) => x.passed).length,
      generationsTotal: result.generations.length
    }
    await save()
    console.log(JSON.stringify(result.summary))
    if (result.evaluations.some((x) => !x.passed) || result.generations.some((x) => !x.passed)) {
      process.exitCode = 1
    }
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await database.close()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})

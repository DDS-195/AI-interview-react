// 模型传输层统一请求参数、结束原因与截止时间，不负责题目或评分业务。
const axios = require('axios')
const { fail } = require('./aiContract')

const API_KEY = process.env.AI_API_KEY
const BASE_URL = process.env.AI_API_BASE_URL
const MODEL = process.env.AI_MODEL || 'your-model-name'

function checkConfig() {
  if (!API_KEY || API_KEY.includes('替换')) {
    fail('AI API密钥未正确配置，请检查.env文件', 503)
  }
  try {
    const url = new URL(BASE_URL)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('invalid URL')
    }
  } catch {
    fail('AI 接口地址未正确配置，请检查.env文件', 503)
  }
}

// 业务取消和单次模型截止时间共同生效，避免响应已开始后无限等待。
function requestSignal(signal, timeoutMs) {
  const deadline = AbortSignal.timeout(timeoutMs)
  return { deadline, signal: signal ? AbortSignal.any([signal, deadline]) : deadline }
}

/**
 * 非流式调用 AI API
 * @param {string} systemPrompt - 系统角色提示词
 * @param {string} userPrompt - 用户提示词
 * @param {object} opts - { temperature, max_tokens }
 */
async function callAI(systemPrompt, userPrompt, opts = {}) {
  checkConfig()
  const { temperature = 0.2, max_tokens = 1800 } = opts
  const request = requestSignal(opts.signal, 45000)

  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  let response
  try {
    response = await axios.post(
      `${BASE_URL.replace(/\/$/, '')}/chat/completions`,
      {
        model: MODEL,
        messages,
        temperature,
        max_tokens,
        stream: false,
        response_format: { type: 'json_object' }
      },
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        timeout: 45000,
        signal: request.signal,
        maxContentLength: 1024 * 1024
      }
    )
  } catch (error) {
    if (request.deadline.aborted && !opts.signal?.aborted) {
      fail('AI 请求超时，请重试', 504)
    }
    throw error
  }

  const choice = response.data.choices?.[0]
  if (!choice || choice.finish_reason !== 'stop') {
    fail(
      choice?.finish_reason === 'length'
        ? 'AI 输出达到长度上限，请重试'
        : 'AI 输出未正常完成，请重试'
    )
  }
  if (!choice.message?.content?.trim()) {
    fail('AI 未返回有效响应')
  }
  return {
    content: choice.message.content,
    model: response.data.model || MODEL,
    finishReason: choice.finish_reason
  }
}

/**
 * 流式调用 AI API
 * @returns {Promise<import('stream').Readable>}
 */
async function callAIStream(systemPrompt, userPrompt, opts = {}) {
  checkConfig()
  const { temperature = 0.7, max_tokens = 2200 } = opts
  const request = requestSignal(opts.signal, 60000)

  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  let response
  try {
    response = await axios.post(
      `${BASE_URL.replace(/\/$/, '')}/chat/completions`,
      {
        model: MODEL,
        messages,
        temperature,
        max_tokens,
        stream: true,
        response_format: { type: 'json_object' }
      },
      {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        timeout: 60000,
        signal: request.signal,
        responseType: 'stream'
      }
    )
  } catch (error) {
    if (request.deadline.aborted && !opts.signal?.aborted) {
      fail('AI 请求超时，请重试', 504)
    }
    throw error
  }

  // 流开始后 Axios 已返回，仍需把整体截止时间转为可识别的超时错误。
  response.data.on('error', (error) => {
    if (request.deadline.aborted && !opts.signal?.aborted) {
      error.status = 504
      error.message = 'AI 请求超时，请重试'
    }
  })
  return response.data
}

module.exports = { callAI, callAIStream }

const axios = require('axios')

const API_KEY = process.env.AI_API_KEY
const BASE_URL = process.env.AI_API_BASE_URL
const MODEL = process.env.AI_MODEL || 'your-model-name'

function checkConfig() {
  if (!API_KEY || API_KEY.includes('替换')) {
    throw new Error('AI API密钥未正确配置，请检查.env文件')
  }
}

/**
 * 非流式调用 AI API
 * @param {string} systemPrompt - 系统角色提示词
 * @param {string} userPrompt - 用户提示词
 * @param {object} opts - { temperature, max_tokens }
 */
async function callAI(systemPrompt, userPrompt, opts = {}) {
  checkConfig()
  const { temperature = 0.7, max_tokens = 512 } = opts

  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  const response = await axios.post(`${BASE_URL}/chat/completions`, {
    model: MODEL,
    messages,
    temperature,
    max_tokens,
    stream: false
  }, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    timeout: 30000
  })

  if (response.data.choices?.length > 0) {
    return response.data.choices[0].message.content
  }
  throw new Error('AI 未返回有效响应')
}

/**
 * 流式调用 AI API
 * @returns {Promise<import('stream').Readable>}
 */
async function callAIStream(systemPrompt, userPrompt, opts = {}) {
  checkConfig()
  const { temperature = 0.8, max_tokens = 512 } = opts

  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  const response = await axios.post(`${BASE_URL}/chat/completions`, {
    model: MODEL,
    messages,
    temperature,
    max_tokens,
    stream: true
  }, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    timeout: 60000,
    responseType: 'stream'
  })

  return response.data
}

module.exports = { callAI, callAIStream }

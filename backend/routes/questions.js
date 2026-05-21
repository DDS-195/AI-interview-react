const express = require('express')
const router = express.Router()
const { callAI, callAIStream } = require('../services/aiService')
const {
  buildQuestionSystemPrompt,
  buildQuestionUserPrompt,
  buildStreamQuestionPrompt
} = require('../prompts/questionPrompts')

function parseMetadata(lines) {
  const last = lines[lines.length - 1]?.trim() || ''

  // 整行就是 JSON
  try {
    const meta = JSON.parse(last)
    if (meta.difficulty && ['easy', 'medium', 'hard'].includes(meta.difficulty)) {
      return { difficulty: meta.difficulty, topic: meta.topic || '', bodyLines: lines.slice(0, -1) }
    }
  } catch {}

  // JSON 拼接在最后一行末尾，提取末尾 {...} 对象
  const tailMatch = last.match(/\{[^{}]*"difficulty"[^{}]*\}$/)
  if (tailMatch) {
    try {
      const meta = JSON.parse(tailMatch[0])
      if (meta.difficulty && ['easy', 'medium', 'hard'].includes(meta.difficulty)) {
        const cleanedLast = last.slice(0, -tailMatch[0].length).trim()
        const bodyLines = lines.slice(0, -1)
        if (cleanedLast) bodyLines.push(cleanedLast)
        return { difficulty: meta.difficulty, topic: meta.topic || '', bodyLines: bodyLines.filter(Boolean) }
      }
    } catch {}
  }

  return { difficulty: 'medium', topic: '', bodyLines: lines }
}

function smartTruncate(text, maxLen) {
  if (text.length <= maxLen) return text
  const truncated = text.substring(0, maxLen)
  const lastPeriod = Math.max(
    truncated.lastIndexOf('。'), truncated.lastIndexOf('？'),
    truncated.lastIndexOf('！'), truncated.lastIndexOf('\n'),
    truncated.lastIndexOf('?'), truncated.lastIndexOf('.')
  )
  if (lastPeriod > maxLen * 0.6) return truncated.substring(0, lastPeriod + 1)
  // fallback: 断在最后一个完整词
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > maxLen * 0.6 ? truncated.substring(0, lastSpace) : truncated
}

/**
 * POST /api/ai/generate-question (非流式)
 */
router.post('/generate-question', async (req, res) => {
  try {
    const { category, existingTitles = [] } = req.body
    if (!category) return res.status(400).json({ error: '缺少category参数' })

    const systemPrompt = buildQuestionSystemPrompt()
    const userPrompt = buildQuestionUserPrompt(category, existingTitles)

    const maxTokens = category === 'coding' ? 500 : 180
    const response = await callAI(systemPrompt, userPrompt, { temperature: 0.9, max_tokens: maxTokens })

    // 解析 JSON 元信息
    let title = '', content = '', difficulty = 'medium', topic = ''
    const jsonMatch = response.match(/\{[\s\S]*"difficulty"[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[0])
        difficulty = ['easy', 'medium', 'hard'].includes(meta.difficulty) ? meta.difficulty : 'medium'
        topic = meta.topic || ''
      } catch {}
    }

    const bodyText = response.replace(/\{[\s\S]*"difficulty"[\s\S]*\}/, '').trim()
    const lines = bodyText.split('\n').filter(Boolean)
    title = lines[0]?.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim() || `${category} 面试题`
    content = lines.slice(1).join('\n').trim() || bodyText

    // 非 coding 类题目截断更短
    const maxLen = category === 'coding' ? 600 : 280
    content = smartTruncate(content, maxLen)

    res.json({ title, content, difficulty, category, topic })
  } catch (error) {
    console.error('生成题目失败:', error.message)
    res.status(500).json({ error: '生成题目失败', message: error.message })
  }
})

/**
 * POST /api/ai/generate-question-stream (SSE)
 */
router.post('/generate-question-stream', async (req, res) => {
  const { category, existingTitles = [] } = req.body
  if (!category) return res.status(400).json({ error: '缺少category参数' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const { systemPrompt, userPrompt } = buildStreamQuestionPrompt(category, existingTitles)
    const maxTokens = category === 'coding' ? 500 : 150
    const stream = await callAIStream(systemPrompt, userPrompt, { temperature: 0.9, max_tokens: maxTokens })

    let fullContent = ''
    let buffer = ''
    let finished = false

    function sendDone() {
      if (finished || res.writableEnded) return
      finished = true
      const contentLines = fullContent.split('\n').filter(Boolean)
      const { difficulty, topic, bodyLines } = parseMetadata(contentLines)
      const title = bodyLines[0]?.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim() || '题目'
      const body = bodyLines.slice(1).join('\n').trim() || fullContent
      res.write(`data: ${JSON.stringify({ done: true, title, body, difficulty, topic })}\n\n`)
      res.end()
    }

    function parseSSEStream(chunk) {
      if (finished) return true
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') {
          sendDone()
          return true
        }
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullContent += content
            res.write(`data: ${JSON.stringify({ content, fullContent })}\n\n`)
          }
        } catch { /* skip malformed */ }
      }
      return false
    }

    stream.on('data', (chunk) => { parseSSEStream(chunk) })

    stream.on('end', () => { sendDone() })

    stream.on('error', (err) => {
      console.error('Stream error:', err.message)
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        res.end()
      }
    })

    req.on('close', () => {
      if (stream.destroy) stream.destroy()
    })
  } catch (error) {
    console.error('流式生成失败:', error.message)
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    }
  }
})

module.exports = router

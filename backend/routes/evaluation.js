const express = require('express')
const router = express.Router()
const { callAI } = require('../services/aiService')
const {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt
} = require('../prompts/evaluationPrompts')

/**
 * POST /api/ai/evaluate-answer
 * 评估用户答案
 */
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, answer } = req.body
    if (!question || !answer) return res.status(400).json({ error: '缺少 question 或 answer 参数' })

    const systemPrompt = buildEvaluationSystemPrompt()
    const userPrompt = buildEvaluationUserPrompt(question, answer)

    const response = await callAI(systemPrompt, userPrompt, { temperature: 0.4, max_tokens: 800 })

    // 尝试提取最外层 JSON 对象（包含 "score" 字段）
    const jsonStart = response.indexOf('{')
    const jsonEnd = response.lastIndexOf('}')
    let parsed = null

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        parsed = JSON.parse(response.slice(jsonStart, jsonEnd + 1))
      } catch {
        // 尝试匹配包含 score 的 JSON 块
        const jsonMatch = response.match(/\{[\s\S]*?"score"[\s\S]*?\}/)
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]) } catch {}
        }
      }
    }

    if (parsed && typeof parsed.score === 'number') {
      const score = Math.min(100, Math.max(0, Math.round(parsed.score)))
      return res.json({
        score,
        feedback: parsed.feedback || '评估完成',
        correctAnswer: parsed.correctAnswer || '',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['请补充更多技术细节']
      })
    }

    // 全部失败，返回默认
    res.json({
      score: 50,
      feedback: '评估服务暂时不可用，请稍后重试',
      correctAnswer: '',
      suggestions: ['请重新提交答案']
    })
  } catch (error) {
    console.error('评估答案失败:', error.message)
    res.status(500).json({ error: '评估答案失败', message: error.message })
  }
})

module.exports = router

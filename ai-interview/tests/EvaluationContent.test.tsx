// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import EvaluationContent from '../src/components/EvaluationContent'
afterEach(cleanup)
it('当前结果和历史使用同一组件，展示零分依据、建议与核对来源', () => {
  render(
    <EvaluationContent
      evaluation={{
        score: 0,
        feedback: '未满足必要项',
        correctAnswer: '正确参考',
        referenceStatus: 'verified',
        suggestions: ['补充实现'],
        sources: [{ title: 'React官方文档', url: 'https://react.dev/reference/react/useEffect' }],
        criteria: [
          {
            id: 'p1',
            description: '交付实现',
            maxPoints: 100,
            points: 0,
            verdict: 'missed',
            evidence: '',
            explanation: '没有代码'
          }
        ]
      }}
    />
  )
  expect(screen.getByText('0 / 100 分')).toBeTruthy()
  expect(screen.getByText('补充实现')).toBeTruthy()
  expect(screen.getByText('已核对参考要点')).toBeTruthy()
  expect(screen.getByRole('link').getAttribute('href')).toBe(
    'https://react.dev/reference/react/useEffect'
  )
})
it('旧记录缺少细项时仍显示反馈和参考答案', () => {
  render(<EvaluationContent evaluation={{ feedback: '旧反馈', correctAnswer: '旧参考' }} />)
  expect(screen.getByText('旧反馈')).toBeTruthy()
  expect(screen.getByText('旧参考')).toBeTruthy()
  expect(screen.queryByText('得分依据')).toBeNull()
})

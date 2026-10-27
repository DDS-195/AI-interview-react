// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const editor = vi.hoisted(() => vi.fn())
vi.mock('../src/components/CodeEditor', () => ({
  default: () => {
    editor()
    return <div>代码编辑器</div>
  }
}))
vi.mock('@ant-design/icons', () => ({ SendOutlined: () => null, ClearOutlined: () => null }))
vi.mock('antd', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: { TextArea: () => <textarea aria-label="答案" /> },
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Spin: () => <div>加载中</div>
}))
import AnswerArea from '../src/components/AnswerArea'
afterEach(() => {
  cleanup()
  editor.mockClear()
})
it('普通题不加载代码编辑器，进入代码题才加载', async () => {
  const props = {
    answerText: '',
    isEvaluatingAnswer: false,
    isGeneratingQuestion: false,
    onAnswerChange: vi.fn(),
    onSubmitAnswer: vi.fn(),
    onClearAnswer: vi.fn()
  }
  const view = render(
    <AnswerArea
      {...props}
      isCodingCategory={false}
    />
  )
  await act(async () => {})
  expect(editor).not.toHaveBeenCalled()
  view.rerender(
    <AnswerArea
      {...props}
      isCodingCategory
    />
  )
  await act(async () => {})
  expect(editor).toHaveBeenCalled()
})

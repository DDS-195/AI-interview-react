// 兜底处理子树渲染异常；请求失败仍由请求层和页面状态处理。
import { Component, type ReactNode } from 'react'
import { Alert, Button } from 'antd'

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="app-error">
          <Alert
            type="error"
            showIcon
            message="页面加载失败"
            description="请重新加载页面。已保存的题目和回答草稿会自动恢复。"
            action={<Button onClick={() => window.location.reload()}>重新加载</Button>}
          />
        </div>
      )
    }
    return this.props.children
  }
}

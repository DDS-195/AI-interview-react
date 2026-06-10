import { memo } from 'react'
import { Button } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
}

export default memo(function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      type="text"
      className="theme-toggle"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={onToggle}
      title={isDark ? '切换亮色模式' : '切换暗色模式'}
    />
  )
})

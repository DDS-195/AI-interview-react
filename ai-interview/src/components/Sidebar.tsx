import { memo, useCallback, useMemo } from 'react'
import { Layout, Menu, Button } from 'antd'
import {
  QuestionCircleOutlined,
  HistoryOutlined,
  StarOutlined,
  CodeOutlined,
  Html5Outlined,
  ApiOutlined,
  CloudServerOutlined,
  DeploymentUnitOutlined,
  BranchesOutlined,
  BugOutlined,
  ExperimentOutlined,
  ChromeOutlined,
  WifiOutlined,
  ToolOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FileProtectOutlined,
  DashboardOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import type { Category } from '../types'

const { Sider } = Layout

const categoryIcons: Record<string, React.ReactNode> = {
  'html-css': <Html5Outlined />,
  'javascript': <CodeOutlined />,
  'vue': <DeploymentUnitOutlined />,
  'react': <ThunderboltOutlined />,
  'jquery': <ApiOutlined />,
  'nodejs': <CloudServerOutlined />,
  'es6': <ExperimentOutlined />,
  'typescript': <FileProtectOutlined />,
  'performance': <DashboardOutlined />,
  'network': <WifiOutlined />,
  'browser': <ChromeOutlined />,
  'engineering': <ToolOutlined />,
  'git': <BranchesOutlined />,
  'scenario': <BugOutlined />,
  'coding': <RocketOutlined />,
}

interface SidebarProps {
  categories: Category[]
  selectedCategoryId: string
  activeView: string
  collapsed: boolean
  isDark: boolean
  onCollapse: (collapsed: boolean) => void
  onSelectCategory: (categoryId: string) => void
  onShowHistory: () => void
  onShowFavorites: () => void
  onShowQuestions: () => void
  onToggleTheme: () => void
}

export default memo(function Sidebar({
  categories,
  selectedCategoryId,
  activeView,
  collapsed,
  isDark,
  onCollapse,
  onSelectCategory,
  onShowHistory,
  onShowFavorites,
  onShowQuestions,
  onToggleTheme
}: SidebarProps) {
  const navItems = [
    { key: 'questions', icon: <QuestionCircleOutlined />, label: '面试题目', onClick: onShowQuestions },
    { key: 'favorites', icon: <StarOutlined />, label: '我的收藏', onClick: onShowFavorites },
    { key: 'history', icon: <HistoryOutlined />, label: '答题历史', onClick: onShowHistory },
  ]

  const handleNavClick = useCallback(({ key }: { key: string }) => {
    const item = navItems.find(i => i.key === key)
    if (item) item.onClick()
  }, [navItems])

  const handleCatClick = useCallback(({ key }: { key: string }) => {
    onSelectCategory(key)
    onShowQuestions()
  }, [onSelectCategory, onShowQuestions])

  const categoryMenuItems = useMemo(() => categories.map(cat => ({
    key: cat.id,
    icon: categoryIcons[cat.id] || <CodeOutlined />,
    label: cat.name
  })), [categories])

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      className="app-sidebar"
      breakpoint="lg"
      style={{ overflow: 'auto' }}
    >
      <div className="sidebar-logo">
        <div className="logo-icon">AI</div>
        {!collapsed && <span>AI 面试助手</span>}
        {!collapsed && (
          <Button
            type="text"
            className="sidebar-theme-btn"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={onToggleTheme}
            title={isDark ? '切换亮色模式' : '切换暗色模式'}
          />
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activeView]}
        className="sidebar-nav-menu"
        items={navItems}
        onClick={handleNavClick}
      />

      <div className="sidebar-section-title">
        {!collapsed && '题目分类'}
      </div>

      <Menu
        mode="inline"
        selectedKeys={activeView === 'questions' ? [selectedCategoryId] : []}
        className="sidebar-cat-menu"
        items={categoryMenuItems}
        onClick={handleCatClick}
      />
    </Sider>
  )
})

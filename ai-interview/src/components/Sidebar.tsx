// 桌面导航复用分类与路由定义，搜索匹配分类名和知识点名。
import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { Layout, Menu, Button, Input, Select, Popover } from 'antd'
import {
  CodeOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  ToolOutlined,
  SearchOutlined,
  MoreOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import type { Category } from '../types'
import { APP_NAME } from '../config'
import {
  CATEGORY_GROUPS,
  CURRENT_CATEGORIES,
  OPTIONAL_CATEGORIES,
  categoryGroup,
  categoryTopics
} from '../utils/catalog'
import { NAVIGATION } from '../navigation'
const { Sider } = Layout
const groupIcons = {
  foundation: <CodeOutlined />,
  platform: <GlobalOutlined />,
  application: <AppstoreOutlined />,
  quality: <ToolOutlined />
}
interface SidebarProps {
  categories: Category[]
  selectedCategoryId: string
  activeView: string
  collapsed: boolean
  isDark: boolean
  onCollapse: (collapsed: boolean) => void
  onSelectCategory: (id: string) => void
  onNavigate: (path: string) => void
  onToggleTheme: () => void
}
export default memo(function Sidebar({
  selectedCategoryId,
  activeView,
  collapsed,
  isDark,
  onCollapse,
  onSelectCategory,
  onNavigate,
  onToggleTheme
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const group = categoryGroup(selectedCategoryId)
    return group ? [group.id] : []
  })
  useEffect(() => {
    const group = categoryGroup(selectedCategoryId)
    setOpenKeys(group ? [group.id] : [])
  }, [selectedCategoryId])
  const navItems = NAVIGATION.map(({ key, icon, label }) => ({ key, icon, label }))
  const handleNavClick = useCallback(
    ({ key }: { key: string }) => {
      const item = NAVIGATION.find((item) => item.key === key)
      if (item) {
        onNavigate(item.path)
      }
    },
    [onNavigate]
  )
  const choose = useCallback(
    (id: string) => {
      setSearch('')
      const group = categoryGroup(id)
      setOpenKeys(group ? [group.id] : [])
      onSelectCategory(id)
    },
    [onSelectCategory]
  )
  const menuItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (term) {
      return CURRENT_CATEGORIES.filter((category) =>
        [category.name, ...categoryTopics(category.id).map((topic) => topic.name)].some((label) =>
          label.toLowerCase().includes(term)
        )
      ).map((category) => ({
        key: category.id,
        label: (
          <span className="category-search-label">
            <span>{category.name}</span>
            <small>{categoryGroup(category.id)?.name || '专项拓展'}</small>
          </span>
        )
      }))
    }
    return CATEGORY_GROUPS.map((group) => ({
      key: group.id,
      icon: groupIcons[group.id as keyof typeof groupIcons],
      label: (
        <span className="category-group-label">
          {group.name}
          {group.categories.includes(selectedCategoryId) && (
            <span
              className="category-group-dot"
              aria-label="当前分组"
            />
          )}
        </span>
      ),
      children: group.categories.map((id) => ({
        key: id,
        label: CURRENT_CATEGORIES.find((category) => category.id === id)!.name
      }))
    }))
  }, [search, selectedCategoryId])
  const specialSelect = (
    <Select
      aria-label="专项方向"
      placeholder="选择专项方向"
      value={
        OPTIONAL_CATEGORIES.some((category) => category.id === selectedCategoryId)
          ? selectedCategoryId
          : undefined
      }
      options={OPTIONAL_CATEGORIES.map((category) => ({
        value: category.id,
        label: category.name
      }))}
      onChange={choose}
      className="sidebar-special-select"
    />
  )
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={232}
      className="app-sidebar"
      breakpoint="lg"
      style={{ overflow: 'auto' }}
    >
      <div className={`sidebar-logo${collapsed ? ' sidebar-logo-collapsed' : ''}`}>
        <div className="logo-icon">AI</div>
        {!collapsed && <span>{APP_NAME}</span>}
        <Button
          type="text"
          className="sidebar-theme-btn"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={onToggleTheme}
          aria-label={isDark ? '切换亮色模式' : '切换暗色模式'}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[activeView]}
        className="sidebar-nav-menu"
        items={navItems}
        onClick={handleNavClick}
      />
      <div className="sidebar-section-title">{!collapsed && '题目分类'}</div>
      {!collapsed && (
        <div className="sidebar-category-search">
          <Input
            aria-label="搜索分类或知识点"
            placeholder="搜索分类或知识点"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
          />
        </div>
      )}
      <Menu
        mode="inline"
        theme="dark"
        triggerSubMenuAction="click"
        inlineIndent={16}
        selectedKeys={[selectedCategoryId]}
        openKeys={collapsed ? undefined : openKeys}
        onOpenChange={(keys) =>
          setOpenKeys(
            keys.length
              ? [keys.find((key) => !openKeys.includes(key)) || keys[keys.length - 1]]
              : []
          )
        }
        className={`sidebar-cat-menu${search.trim() ? ' sidebar-search-results' : ''}`}
        items={menuItems}
        onClick={({ key }) => choose(key)}
      />
      {search.trim() && !menuItems.length && (
        <div className="sidebar-search-empty">未找到分类或知识点</div>
      )}
      <div className="sidebar-extensions">
        {collapsed ? (
          <Popover
            trigger="click"
            placement="right"
            title="专项拓展"
            content={specialSelect}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              aria-label="专项拓展"
            />
          </Popover>
        ) : (
          <>
            <span>专项拓展</span>
            {specialSelect}
          </>
        )}
      </div>
    </Sider>
  )
})

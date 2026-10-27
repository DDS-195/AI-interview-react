// 手机主导航保留常用训练入口，收藏和历史通过更多菜单进入。
import { memo, useState } from 'react'
import { Button, Drawer } from 'antd'
import { MoreOutlined } from '@ant-design/icons'
import { NAVIGATION } from '../navigation'

export default memo(function MobileNav({
  activeView,
  onNavigate
}: {
  activeView: string
  onNavigate: (path: string) => void
}) {
  const [more, setMore] = useState(false)
  const secondary = NAVIGATION.slice(4)
  const moreActive = secondary.some((item) => item.key === activeView)
  return (
    <>
      <nav
        className="mobile-nav"
        aria-label="主导航"
      >
        <div className="mobile-nav-bar">
          {NAVIGATION.slice(0, 4).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mobile-nav-btn${activeView === item.key ? ' active' : ''}`}
              onClick={() => onNavigate(item.path)}
              aria-current={activeView === item.key ? 'page' : undefined}
            >
              {item.icon}
              <span className="mobile-nav-label">{item.shortLabel}</span>
            </button>
          ))}
          <button
            type="button"
            className={`mobile-nav-btn${moreActive ? ' active' : ''}`}
            onClick={() => setMore(true)}
            aria-expanded={more}
            aria-label="更多页面"
          >
            <MoreOutlined />
            <span className="mobile-nav-label">
              {secondary.find((item) => item.key === activeView)?.shortLabel || '更多'}
            </span>
          </button>
        </div>
      </nav>
      <Drawer
        title="学习记录"
        placement="bottom"
        height="auto"
        open={more}
        onClose={() => setMore(false)}
        rootClassName="learning-more-drawer"
      >
        <div className="learning-more-links">
          {secondary.map((item) => (
            <Button
              key={item.key}
              size="large"
              icon={item.icon}
              aria-label={item.label}
              type={item.key === activeView ? 'primary' : 'default'}
              onClick={() => {
                setMore(false)
                onNavigate(item.path)
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </Drawer>
    </>
  )
})

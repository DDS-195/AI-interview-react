// 手机顶部显示当前分类路径，并提供打开分类面板的入口。
import { lazy, memo, Suspense, useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import type { Category } from '../types'
import { APP_NAME } from '../config'
import { categoryPath } from '../utils/catalog'
const MobileCategoryDrawer = lazy(() => import('./MobileCategoryDrawer'))
interface MobileTopBarProps {
  categories: Category[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
}
export default memo(function MobileTopBar({
  selectedCategoryId,
  onSelectCategory
}: MobileTopBarProps) {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  return (
    <>
      <div className="mobile-topbar">
        <div className="mobile-topbar-inner">
          <div className="mobile-topbar-title">{APP_NAME}</div>
          <button
            type="button"
            className="mobile-category-trigger"
            aria-label="选择题目分类"
            aria-expanded={open}
            onClick={() => {
              setHasOpened(true)
              setOpen(true)
            }}
          >
            <span>{categoryPath(selectedCategoryId)}</span>
            <DownOutlined />
          </button>
        </div>
      </div>
      {hasOpened && (
        <Suspense
          fallback={
            open ? (
              <div
                className="mobile-category-loading"
                role="status"
              >
                正在打开分类…
              </div>
            ) : null
          }
        >
          <MobileCategoryDrawer
            open={open}
            selectedCategoryId={selectedCategoryId}
            onClose={() => setOpen(false)}
            onSelectCategory={onSelectCategory}
          />
        </Suspense>
      )}
    </>
  )
})

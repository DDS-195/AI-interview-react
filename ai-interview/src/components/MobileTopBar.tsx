import { memo, useCallback, useRef, useEffect } from 'react'
import type { Category } from '../types'

interface MobileTopBarProps {
  categories: Category[]
  selectedCategoryId: string
  onSelectCategory: (categoryId: string) => void
}

export default memo(function MobileTopBar({
  categories,
  selectedCategoryId,
  onSelectCategory
}: MobileTopBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // 选中项自动滚动到可视区域
  useEffect(() => {
    const el = itemRefs.current.get(selectedCategoryId)
    if (el && scrollRef.current) {
      const container = scrollRef.current
      const offset = el.offsetLeft - container.offsetLeft - 12
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [selectedCategoryId])

  const setRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      itemRefs.current.set(id, el)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  return (
    <div className="mobile-topbar">
      <div className="mobile-topbar-inner">
        <div className="mobile-topbar-title">AI 面试助手</div>
        <div className="mobile-cat-strip" ref={scrollRef}>
          {categories.map(cat => (
            <button
              key={cat.id}
              ref={(el) => setRef(cat.id, el)}
              className={`mobile-cat-chip${cat.id === selectedCategoryId ? ' active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

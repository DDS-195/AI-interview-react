// 手机分类面板复用共享目录，展开一级分组不会自动调用模型。
import { useEffect, useState } from 'react'
import { Drawer, Select } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import {
  CATEGORY_GROUPS,
  CURRENT_CATEGORIES,
  OPTIONAL_CATEGORIES,
  categoryGroup
} from '../utils/catalog'

interface MobileCategoryDrawerProps {
  open: boolean
  selectedCategoryId: string
  onClose: () => void
  onSelectCategory: (id: string) => void
}

export default function MobileCategoryDrawer({
  open,
  selectedCategoryId,
  onClose,
  onSelectCategory
}: MobileCategoryDrawerProps) {
  const [groupId, setGroupId] = useState(
    categoryGroup(selectedCategoryId)?.id || CATEGORY_GROUPS[0].id
  )
  useEffect(() => {
    if (open) {
      setGroupId(categoryGroup(selectedCategoryId)?.id || CATEGORY_GROUPS[0].id)
    }
  }, [open, selectedCategoryId])
  const group = CATEGORY_GROUPS.find((item) => item.id === groupId)!
  const choose = (id: string) => {
    onSelectCategory(id)
    onClose()
  }
  return (
    <Drawer
      title="选择分类"
      placement="bottom"
      height="auto"
      open={open}
      onClose={onClose}
      rootClassName="mobile-category-drawer"
      destroyOnHidden
    >
      <div className="mobile-category-columns">
        <nav
          className="mobile-category-groups"
          aria-label="一级分类"
        >
          {CATEGORY_GROUPS.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={item.id === groupId}
              onClick={() => setGroupId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </nav>
        <nav
          className="mobile-category-leaves"
          aria-label="二级分类"
        >
          {group.categories.map((id) => (
            <button
              type="button"
              key={id}
              aria-pressed={id === selectedCategoryId}
              onClick={() => choose(id)}
            >
              <span>{CURRENT_CATEGORIES.find((category) => category.id === id)!.name}</span>
              {id === selectedCategoryId && <CheckOutlined />}
            </button>
          ))}
        </nav>
      </div>
      <div className="mobile-category-extensions">
        <span>专项拓展</span>
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
          getPopupContainer={(trigger) => trigger.parentElement!}
        />
      </div>
    </Drawer>
  )
}

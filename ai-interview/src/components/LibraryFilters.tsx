// 题库和复习共用筛选控件，分类变化时由调用方统一处理关联条件。
import { Input, Select, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { CATEGORIES, categoryTopics, QUESTION_MODES } from '../utils/catalog'

export default function LibraryFilters({
  values,
  onChange,
  onReset,
  reviews
}: {
  values: URLSearchParams
  onChange: (key: string, value: string) => void
  onReset: () => void
  reviews: boolean
}) {
  const categoryId = values.get('categoryId') || ''
  const [expanded, setExpanded] = useState(false)
  const filterCount = ['categoryId', 'topicId', 'mode', 'difficulty', 'practice', 'status'].filter(
    (key) => values.get(key)
  ).length
  const select = (key: string, label: string, options: { value: string; label: string }[]) => (
    <label key={key}>
      <span>{label}</span>
      <Select
        aria-label={label}
        value={values.get(key) || ''}
        onChange={(value) => onChange(key, value)}
        options={options}
        showSearch
        optionFilterProp="label"
      />
    </label>
  )
  return (
    <div className="library-filters">
      <Input.Search
        aria-label="搜索题目"
        placeholder="搜索标题、内容或知识点"
        prefix={<SearchOutlined />}
        defaultValue={values.get('keyword') || ''}
        key={values.get('keyword') || ''}
        allowClear
        onSearch={(value) => onChange('keyword', value.trim())}
        className="library-search"
      />
      <div className="library-mobile-filter-toggle">
        <span>{filterCount ? `已选 ${filterCount} 项筛选` : '按分类、知识点等筛选'}</span>
        <Button
          size="small"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? '收起筛选' : '展开筛选'}
        </Button>
      </div>
      <div className={`library-filter-grid${expanded ? ' is-expanded' : ''}`}>
        {select('categoryId', '分类', [
          { value: '', label: '全部分类' },
          ...CATEGORIES.map((category) => ({ value: category.id, label: category.name }))
        ])}
        {select('topicId', '知识点', [
          { value: '', label: categoryId ? '全部知识点' : '先选择分类' },
          ...categoryTopics(categoryId).map((topic) => ({ value: topic.id, label: topic.name }))
        ])}
        {select('mode', '题型', [
          { value: '', label: '全部题型' },
          ...QUESTION_MODES.map((mode) => ({ value: mode.id, label: mode.name }))
        ])}
        {select('difficulty', '难度', [
          { value: '', label: '全部难度' },
          { value: 'easy', label: '简单' },
          { value: 'medium', label: '中等' },
          { value: 'hard', label: '困难' }
        ])}
        {select('practice', '作答状态', [
          { value: '', label: '全部题目' },
          { value: 'unpracticed', label: '尚未作答' },
          { value: 'practiced', label: '已经作答' }
        ])}
        {reviews &&
          select('status', '复习状态', [
            { value: '', label: '待复习' },
            { value: 'completed', label: '已完成' },
            { value: 'all', label: '全部复习题' }
          ])}
        <Button
          onClick={onReset}
          className="library-reset"
        >
          重置筛选
        </Button>
      </div>
    </div>
  )
}

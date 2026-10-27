// 这里调整下一题范围；是否立即生成由题目页的分类请求机制决定。
import { Select } from 'antd'
import { useQuestionContext } from '../contexts/QuestionContext'
import { availableModes, categoryPath, categoryTopics, QUESTION_MODES } from '../utils/catalog'

export default function QuestionFilters() {
  const {
    selectedCategoryId,
    selectedTopicId,
    selectedMode,
    selectedDifficulty,
    selectTopic,
    selectMode,
    selectDifficulty
  } = useQuestionContext()
  const modes = availableModes(selectedCategoryId, selectedTopicId)
  return (
    <section
      className="question-filters"
      aria-label="下一题出题范围"
    >
      <div className="question-scope">
        <span>出题范围</span>
        <strong>{categoryPath(selectedCategoryId)}</strong>
      </div>
      <div className="question-filter-controls">
        <label>
          <span>知识点</span>
          <Select
            aria-label="知识点筛选"
            showSearch
            optionFilterProp="label"
            value={selectedTopicId || ''}
            onChange={selectTopic}
            options={[
              { value: '', label: '不限' },
              ...categoryTopics(selectedCategoryId).map((topic) => ({
                value: topic.id,
                label: topic.name
              }))
            ]}
          />
        </label>
        <label>
          <span>题型</span>
          <Select
            aria-label="练习模式"
            value={selectedMode || 'theory'}
            onChange={selectMode}
            options={QUESTION_MODES.map((mode) => ({
              value: mode.id,
              label: mode.name,
              disabled: !modes.includes(mode.id)
            }))}
          />
        </label>
        <label>
          <span>难度</span>
          <Select
            aria-label="题目难度"
            value={selectedDifficulty || ''}
            onChange={selectDifficulty}
            options={[
              { value: '', label: '自动' },
              { value: 'easy', label: '简单' },
              { value: 'medium', label: '中等' },
              { value: 'hard', label: '困难' }
            ]}
          />
        </label>
      </div>
    </section>
  )
}

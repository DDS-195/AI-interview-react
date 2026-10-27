// 展示练习统计和样本数；空样本不当作零分，也不额外调用模型推断能力。
import { Alert, Button, Card, Collapse, Empty, Progress, Select, Spin, Statistic, Tag } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuestionContext } from '../contexts/QuestionContext'
import { useDataResource } from '../hooks/useDataResource'
import { CURRENT_CATEGORIES, QUESTION_MODES } from '../utils/catalog'
import ScoreTrend from '../components/ScoreTrend'
import type { LearningOverview } from '../types'

export default function LearningOverviewPage({
  onNavigateToQuestion
}: {
  onNavigateToQuestion: () => void
}) {
  const { selectedCategoryId } = useQuestionContext()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const categoryId = params.has('categoryId') ? params.get('categoryId') || '' : selectedCategoryId
  const { data, loading, error, retry } = useDataResource<LearningOverview>(
    `/learning?${new URLSearchParams({ categoryId })}`
  )
  const goTopic = (categoryId: string, topicId: string) =>
    navigate(`/bank?${new URLSearchParams({ categoryId, topicId })}`)
  return (
    <div className="learning-page">
      <div className="learning-page-heading">
        <div>
          <h1>学习概览</h1>
          <p>看见练习进度，也找到下一步需要巩固的知识点。</p>
        </div>
        <Button onClick={onNavigateToQuestion}>返回练习</Button>
      </div>
      <div className="overview-scope">
        <label>
          <span>统计范围</span>
          <Select
            aria-label="统计范围"
            value={categoryId}
            showSearch
            optionFilterProp="label"
            onChange={(value) => setParams({ categoryId: value }, { replace: true })}
            options={[
              { value: '', label: '全部方向（含专项）' },
              ...CURRENT_CATEGORIES.map((category) => ({
                value: category.id,
                label: category.name
              }))
            ]}
          />
        </label>
        <Button onClick={() => navigate(`/reviews?${new URLSearchParams({ categoryId })}`)}>
          查看待复习
        </Button>
      </div>
      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button onClick={retry}>重试</Button>}
        />
      ) : loading ? (
        <div className="learning-loading">
          <Spin tip="正在整理学习数据…">
            <div style={{ height: 160 }} />
          </Spin>
        </div>
      ) : (
        data && (
          <>
            <div className="learning-stat-grid">
              <Card size="small">
                <Statistic
                  title="已生成题目"
                  value={data.totals.generatedQuestions}
                  suffix="道"
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="已作答题目"
                  value={data.totals.practicedQuestions}
                  suffix="道"
                />
                <p>累计作答 {data.totals.attempts} 次</p>
              </Card>
              <Card size="small">
                <Statistic
                  title="每题最近平均分"
                  value={data.totals.averageLatestScore ?? '—'}
                />
                <p>已评分 {data.totals.scoredAttempts} 次</p>
              </Card>
              <Card size="small">
                <Statistic
                  title="待复习题目"
                  value={data.totals.pendingReviews}
                  suffix="道"
                />
              </Card>
            </div>
            <div className="overview-two-column">
              <Card
                title="知识点覆盖"
                className="learning-card"
              >
                <div className="coverage-summary">
                  <strong>
                    {data.totals.coveredTopics}
                    <small> / {data.totals.totalTopics}</small>
                  </strong>
                  <span>已练过知识点</span>
                </div>
                <Progress
                  percent={
                    data.totals.totalTopics
                      ? Math.round((data.totals.coveredTopics / data.totals.totalTopics) * 100)
                      : 0
                  }
                />
                <p className="learning-note">
                  生成题目不计入覆盖；完成一次作答才计入。覆盖表示练习过，成绩需结合评分查看。
                </p>
                <div className="learning-mode-list">
                  {QUESTION_MODES.map((mode) => {
                    const count = data.modes.find((item) => item.mode === mode.id)
                    return (
                      <div key={mode.id}>
                        <span>{mode.name}</span>
                        <strong>{count?.attempts || 0} 次</strong>
                      </div>
                    )
                  })}
                </div>
              </Card>
              <Card
                title="成绩趋势"
                className="learning-card"
              >
                <ScoreTrend trend={data.trend} />
                <p className="learning-note">
                  最近 14 个作答日，按北京时间统计当天所有已评分回答的平均分。
                </p>
              </Card>
            </div>
            <Card
              title="需要巩固的知识点"
              className="learning-card"
            >
              {data.weakTopics.length ? (
                <div className="weak-topic-grid">
                  {data.weakTopics.map((topic) => (
                    <div
                      className="weak-topic"
                      key={topic.id}
                    >
                      <div>
                        <strong>{topic.name}</strong>
                        <span>
                          {topic.categoryName} · 练过 {topic.practicedQuestions} 道题
                        </span>
                      </div>
                      <Tag color="orange">最近平均 {topic.averageScore} 分</Tag>
                      <Button
                        size="small"
                        onClick={() => goTopic(topic.categoryId, topic.id)}
                      >
                        练习此知识点
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无低于 80 分的知识点，完成更多练习后查看"
                />
              )}
              <p className="learning-note">
                按每题最近一次评分汇总；多次重练同一道题不会重复增加覆盖数量。
              </p>
            </Card>
            {data.skillProfile && (
              <Card
                title="分类练习成绩"
                className="learning-card"
              >
                <p className="learning-note">
                  基于不同题目的最近评分形成练习指标；重复题干合并，未练习的方向不记为零分。少于 3
                  道题时样本不足。
                </p>
                <div className="weak-topic-grid">
                  {data.skillProfile.categories
                    .filter((category) => category.sampleSize > 0)
                    .map((category) => (
                      <div
                        className="weak-topic"
                        key={category.categoryId}
                      >
                        <div>
                          <strong>{category.categoryName}</strong>
                          <span>
                            {category.sampleSize} 道不同题目
                            {category.sampleSize < 3 && ' · 样本不足'}
                          </span>
                        </div>
                        <Tag color="blue">最近平均 {category.score} 分</Tag>
                      </div>
                    ))}
                </div>
                {!data.skillProfile.categories.some((category) => category.sampleSize > 0) && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="完成作答后查看分类成绩"
                  />
                )}
              </Card>
            )}
            <Card
              title="分类与知识点进度"
              className="learning-card"
            >
              <Collapse
                items={data.categories.map((category) => ({
                  key: category.id,
                  label: (
                    <div className="coverage-category-title">
                      <strong>
                        {category.name}
                        {category.optional && <Tag>专项</Tag>}
                      </strong>
                      <span>
                        {category.coveredTopics}/{category.totalTopics} 知识点 · 已答{' '}
                        {category.practicedQuestions}/{category.generatedQuestions} 道
                      </span>
                    </div>
                  ),
                  children: (
                    <div className="topic-progress-table">
                      <div className="topic-progress-header">
                        <span>知识点</span>
                        <span>已答 / 已生成</span>
                        <span>最近均分</span>
                      </div>
                      {category.topics.map((topic) => (
                        <button
                          className="topic-progress-row"
                          key={topic.id}
                          onClick={() => goTopic(category.id, topic.id)}
                        >
                          <span>
                            {topic.name}
                            {topic.pendingReviews > 0 && (
                              <small>待复习 {topic.pendingReviews} 道</small>
                            )}
                          </span>
                          <span>
                            {topic.practicedQuestions} / {topic.generatedQuestions}
                          </span>
                          <span>{topic.averageScore ?? '—'}</span>
                        </button>
                      ))}
                    </div>
                  )
                }))}
              />
              <p className="learning-note">
                旧题缺少可匹配的知识点时，仍计入题目和作答数量，不计入知识点覆盖。
              </p>
            </Card>
          </>
        )
      )}
    </div>
  )
}

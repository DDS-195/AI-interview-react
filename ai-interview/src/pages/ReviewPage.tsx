// 复习页复用题库交互，接口根据最近成绩与人工标记计算复习状态。
import QuestionLibrary from '../components/QuestionLibrary'
export default function ReviewPage(props: { onNavigateToQuestion: () => void }) {
  return (
    <QuestionLibrary
      {...props}
      reviews
    />
  )
}

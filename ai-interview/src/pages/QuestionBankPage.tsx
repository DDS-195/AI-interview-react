// 题库页复用 QuestionLibrary，打开保存题目不触发付费生成。
import QuestionLibrary from '../components/QuestionLibrary'
export default function QuestionBankPage(props: { onNavigateToQuestion: () => void }) {
  return (
    <QuestionLibrary
      {...props}
      reviews={false}
    />
  )
}

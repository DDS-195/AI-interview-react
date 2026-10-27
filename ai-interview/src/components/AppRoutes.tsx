// 页面按路由懒加载；Suspense 处理加载，ErrorBoundary 处理渲染错误。
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import ErrorBoundary from './ErrorBoundary'

const QuestionPage = lazy(() => import('../pages/QuestionPage'))
const HistoryPage = lazy(() => import('../pages/HistoryPage'))
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'))
const QuestionBankPage = lazy(() => import('../pages/QuestionBankPage'))
const ReviewPage = lazy(() => import('../pages/ReviewPage'))
const LearningOverviewPage = lazy(() => import('../pages/LearningOverviewPage'))
const KnowledgePage = lazy(() => import('../pages/KnowledgePage'))

export default function AppRoutes({ onNavigateToQuestion }: { onNavigateToQuestion: () => void }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Spin tip="正在加载页面…">
            <div style={{ minHeight: 240 }} />
          </Spin>
        }
      >
        <Routes>
          <Route
            path="/"
            element={<QuestionPage />}
          />
          <Route
            path="/history"
            element={<HistoryPage onNavigateToQuestion={onNavigateToQuestion} />}
          />
          <Route
            path="/favorites"
            element={<FavoritesPage onNavigateToQuestion={onNavigateToQuestion} />}
          />
          <Route
            path="/bank"
            element={<QuestionBankPage onNavigateToQuestion={onNavigateToQuestion} />}
          />
          <Route
            path="/reviews"
            element={<ReviewPage onNavigateToQuestion={onNavigateToQuestion} />}
          />
          <Route
            path="/overview"
            element={<LearningOverviewPage onNavigateToQuestion={onNavigateToQuestion} />}
          />
          <Route
            path="/knowledge"
            element={<KnowledgePage />}
          />
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

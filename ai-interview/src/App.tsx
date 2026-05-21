import { useState, useEffect, useCallback, useMemo } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Sidebar from './components/Sidebar'
import QuestionPage from './pages/QuestionPage'
import HistoryPage from './pages/HistoryPage'
import FavoritesPage from './pages/FavoritesPage'
import { QuestionProvider, useQuestionContext, CATEGORIES } from './contexts/QuestionContext'
import { FavoriteProvider, useFavoriteContext } from './contexts/FavoriteContext'
import { HistoryProvider, useHistoryContext } from './contexts/HistoryContext'
import { EvaluationProvider } from './contexts/EvaluationContext'
import './styles.css'

const { Content } = Layout

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const activeView = useMemo(() => {
    if (location.pathname === '/history') return 'history'
    if (location.pathname === '/favorites') return 'favorites'
    return 'questions'
  }, [location.pathname])

  const { selectedCategoryId, selectCategory } = useQuestionContext()
  const { loadFavoritesFromStorage } = useFavoriteContext()
  const { loadHistoryFromStorage } = useHistoryContext()

  useEffect(() => {
    loadFavoritesFromStorage()
    loadHistoryFromStorage()
  }, [loadFavoritesFromStorage, loadHistoryFromStorage])

  const handleSelectCategory = useCallback((categoryId: string) => {
    selectCategory(categoryId)
    navigate('/')
  }, [selectCategory, navigate])

  const handleShowQuestions = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleShowHistory = useCallback(() => {
    navigate('/history')
  }, [navigate])

  const handleShowFavorites = useCallback(() => {
    navigate('/favorites')
  }, [navigate])

  return (
    <Layout className="app-layout">
      <Sidebar
        categories={CATEGORIES}
        selectedCategoryId={selectedCategoryId}
        activeView={activeView}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        onSelectCategory={handleSelectCategory}
        onShowHistory={handleShowHistory}
        onShowFavorites={handleShowFavorites}
        onShowQuestions={handleShowQuestions}
      />
      <Layout>
        <Content className="app-content">
          <div className="app-content-inner">
            <Routes>
              <Route path="/" element={<QuestionPage />} />
              <Route path="/history" element={<HistoryPage onNavigateToQuestion={handleShowQuestions} />} />
              <Route path="/favorites" element={<FavoritesPage onNavigateToQuestion={handleShowQuestions} />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#5b5ef7',
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
        }
      }}
    >
      <BrowserRouter>
        <QuestionProvider>
          <FavoriteProvider>
            <HistoryProvider>
              <EvaluationProvider>
                <AppLayout />
              </EvaluationProvider>
            </HistoryProvider>
          </FavoriteProvider>
        </QuestionProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}

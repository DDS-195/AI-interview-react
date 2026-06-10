import { useState, useEffect, useCallback, useMemo } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
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
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import { initCloudBase, restoreFromCloud } from './utils/cloudSync'
import { loadQuestions, loadFavorites, loadHistory } from './utils/localStorage'
import './styles.css'
import MobileNav from './components/MobileNav'
import MobileTopBar from './components/MobileTopBar'

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
  const { isDark, toggleTheme } = useThemeContext()

  // 加载本地数据
  useEffect(() => {
    loadFavoritesFromStorage()
    loadHistoryFromStorage()
  }, [loadFavoritesFromStorage, loadHistoryFromStorage])

  // 云端同步：启动时拉取合并，然后本地变化会自动推
  useEffect(() => {
    initCloudBase().then(ok => {
      if (!ok) return
      restoreFromCloud(
        loadQuestions() || [],
        loadFavorites() || [],
        loadHistory() || [],
      ).then(({ questions, favorites, history }) => {
        // 云端数据更新到 localStorage，下次加载时生效
        if (questions.length > 0) localStorage.setItem('ai_interview_questions', JSON.stringify(questions))
        if (favorites.length > 0) localStorage.setItem('ai_interview_favorites', JSON.stringify(favorites))
        if (history.length > 0) localStorage.setItem('ai_interview_history', JSON.stringify(history))
        // 数据可能变了，重新加载
        loadFavoritesFromStorage()
        loadHistoryFromStorage()
      })
    })
  }, []) // 只跑一次

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
        isDark={isDark}
        onCollapse={setCollapsed}
        onSelectCategory={handleSelectCategory}
        onShowHistory={handleShowHistory}
        onShowFavorites={handleShowFavorites}
        onShowQuestions={handleShowQuestions}
        onToggleTheme={toggleTheme}
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
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      <MobileTopBar
        categories={CATEGORIES}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />
      <MobileNav
        activeView={activeView}
        onShowQuestions={handleShowQuestions}
        onShowFavorites={handleShowFavorites}
        onShowHistory={handleShowHistory}
      />
    </Layout>
  )
}

function AppInner() {
  const { isDark } = useThemeContext()
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#5b5ef7',
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
        }
      }}
    >
      <HashRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <QuestionProvider>
          <FavoriteProvider>
            <HistoryProvider>
              <EvaluationProvider>
                <AppLayout />
              </EvaluationProvider>
            </HistoryProvider>
          </FavoriteProvider>
        </QuestionProvider>
      </HashRouter>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}

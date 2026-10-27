// 应用装配：组合主题、数据和练习状态 Provider，路由切换只替换页面内容。
import { useState, useCallback, useMemo } from 'react'
import { HashRouter, useNavigate, useLocation } from 'react-router-dom'
import { Layout, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Sidebar from './components/Sidebar'
import { QuestionProvider, useQuestionContext, CATEGORIES } from './contexts/QuestionContext'
import { FavoriteProvider } from './contexts/FavoriteContext'
import { HistoryProvider } from './contexts/HistoryContext'
import { DataProvider } from './contexts/DataContext'
import { EvaluationProvider } from './contexts/EvaluationContext'
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import './styles.css'
import './styles-learning.css'
import MobileNav from './components/MobileNav'
import MobileTopBar from './components/MobileTopBar'
import AppRoutes from './components/AppRoutes'
import ErrorBoundary from './components/ErrorBoundary'
import { NAVIGATION } from './navigation'

const { Content } = Layout
function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const activeView = useMemo(() => {
    return NAVIGATION.find((item) => item.path === location.pathname)?.key || 'questions'
  }, [location.pathname])

  const { selectedCategoryId, selectCategory } = useQuestionContext()
  const { isDark, toggleTheme } = useThemeContext()

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      selectCategory(categoryId)
      navigate('/')
    },
    [selectCategory, navigate]
  )

  const handleShowQuestions = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate])

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
        onNavigate={handleNavigate}
        onToggleTheme={toggleTheme}
      />
      <Layout>
        <Content className="app-content">
          <div className="app-content-inner">
            <AppRoutes onNavigateToQuestion={handleShowQuestions} />
          </div>
        </Content>
      </Layout>
      <ThemeToggle
        isDark={isDark}
        onToggle={toggleTheme}
      />
      <MobileTopBar
        categories={CATEGORIES}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={handleSelectCategory}
      />
      <MobileNav
        activeView={activeView}
        onNavigate={handleNavigate}
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
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
        }
      }}
    >
      <DataProvider>
        <HashRouter>
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
      </DataProvider>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

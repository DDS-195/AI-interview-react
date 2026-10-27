// 同步浏览器主题偏好与根节点属性，供组件库和自定义 CSS 共同使用。
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode
} from 'react'
import { getStored, setStored } from '../utils/browserStorage'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = getStored('ai_interview_theme')
    return saved === 'dark'
  })

  useEffect(() => {
    setStored('ai_interview_theme', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), [])

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return ctx
}

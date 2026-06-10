import { memo, useCallback } from 'react'

interface MobileNavProps {
  activeView: string
  onShowQuestions: () => void
  onShowFavorites: () => void
  onShowHistory: () => void
}

export default memo(function MobileNav({
  activeView,
  onShowQuestions,
  onShowFavorites,
  onShowHistory
}: MobileNavProps) {
  const handleClick = useCallback((view: string) => {
    if (view === 'favorites') onShowFavorites()
    else if (view === 'history') onShowHistory()
    else onShowQuestions()
  }, [onShowFavorites, onShowHistory, onShowQuestions])

  return (
    <div className="mobile-nav">
      <div className="mobile-nav-bar">
        <button
          className={`mobile-nav-btn${activeView === 'questions' ? ' active' : ''}`}
          onClick={() => handleClick('questions')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="mobile-nav-label">题目</span>
        </button>

        <button
          className={`mobile-nav-btn${activeView === 'favorites' ? ' active' : ''}`}
          onClick={() => handleClick('favorites')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="mobile-nav-label">收藏</span>
        </button>

        <button
          className={`mobile-nav-btn${activeView === 'history' ? ' active' : ''}`}
          onClick={() => handleClick('history')}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className="mobile-nav-label">历史</span>
        </button>
      </div>
    </div>
  )
})

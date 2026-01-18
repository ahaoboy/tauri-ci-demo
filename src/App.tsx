import { type FC, useRef, useCallback } from 'react'
import { TabBar } from 'antd-mobile'
import {
  Route,
  useLocation,
  MemoryRouter as Router,
  Routes,
  useNavigate,
} from 'react-router'
import {
  SearchOutline,
  PlayOutline,
  SetOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons'
import './App.css'
import { PlayPage } from './ui/PlayPage'
import { SearchPage } from './ui'

const pageOrder = ['/player', '/library', '/download', '/settings']

const Bottom: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location

  const tabs = [
    {
      key: '/player',
      title: '播放',
      icon: <PlayOutline />,
    },
    {
      key: '/library',
      title: '音乐库',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/download',
      title: '下载',
      icon: <SearchOutline />,
    },
    {
      key: '/settings',
      title: '设置',
      icon: <SetOutline />,
    },
  ]

  return (
    <div className="bottom-nav">
      <TabBar activeKey={pathname} onChange={(value) => navigate(value)}>
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  )
}

const SWIPE_THRESHOLD = 50

const AppContent: FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const { pathname } = location

  const handleStart = useCallback((x: number, y: number) => {
    touchStartX.current = x
    touchStartY.current = y
  }, [])

  const handleEnd = useCallback((x: number, y: number) => {
    const deltaX = x - touchStartX.current
    const deltaY = y - touchStartY.current

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const currentIndex = pageOrder.indexOf(pathname)
      
      if (deltaX < 0 && currentIndex < pageOrder.length - 1) {
        navigate(pageOrder[currentIndex + 1])
      } else if (deltaX > 0 && currentIndex > 0) {
        navigate(pageOrder[currentIndex - 1])
      }
    }
  }, [navigate, pathname])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleStart])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  }, [handleEnd])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    handleEnd(e.clientX, e.clientY)
  }, [handleEnd])

  return (
    <div 
      className="app" 
      onTouchStart={handleTouchStart} 
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="top-nav-wrapper">
        <Bottom />
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/download" element={<SearchPage />} />
          <Route path="/player" element={<PlayPage />} />
          <Route path="/library" element={<h3> lib</h3>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default () => {
  return (
    <Router initialEntries={['/player']}>
      <AppContent />
    </Router>
  )
}

function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>设置</h1>
        <p>管理应用设置和存储空间</p>
      </div>
      <div />
    </div>
  )
}

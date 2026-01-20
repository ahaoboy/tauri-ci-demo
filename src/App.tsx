import { type FC, useRef, useCallback, useState, createContext, useContext, useEffect } from 'react'
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
import { mediaControls, PlaybackStatus, type MediaMetadata } from 'tauri-plugin-media-api'
import './App.css'
import { PlayPage } from './ui/PlayPage'
import { SearchPage } from './ui'
import { SettingsPage } from './ui/SettingPage'
import { LocalAudio, get_loacl_url } from './api'

const pageOrder = ['/player', '/library', '/download', '/settings']

interface AudioContextType {
  currentAudio: LocalAudio | null;
  audioUrl: string | null;
  isPlaying: boolean;
  playAudio: (audio: LocalAudio) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  togglePlay: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null)

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

const SWIPE_THRESHOLD = 25

interface AppContentProps {
  themeMode?: 'light' | 'dark' | 'auto';
  setThemeMode?: (value: 'light' | 'dark' | 'auto') => void;
}

const AppContent: FC<AppContentProps> = ({ themeMode, setThemeMode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const { pathname } = location

  const [currentAudio, setCurrentAudio] = useState<LocalAudio | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    mediaControls.initialize('com.tauri-ci-demo.app', 'MusicFree')
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (currentAudio) {
      const metadata: MediaMetadata = {
        title: currentAudio.audio.title,
        duration: currentAudio.audio.duration || 0,
      }
      mediaControls.updateNowPlaying(metadata, {
        status: isPlaying ? PlaybackStatus.Playing : PlaybackStatus.Paused,
        position: 0,
      }).catch(console.error)
    }
  }, [currentAudio, isPlaying])

  const playAudio = useCallback(async (audio: LocalAudio) => {
    try {
      setCurrentAudio(audio)
      setIsPlaying(true)

      const url = await get_loacl_url(audio.path)
      setAudioUrl(url)

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url
          audioRef.current.play().catch((e) => {
            console.error('Play failed:', e)
          })
        }
      }, 100)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }, [])

  const pauseAudio = useCallback(() => {
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
    }
    mediaControls.updatePlaybackStatus(PlaybackStatus.Paused).catch(console.error)
  }, [])

  const resumeAudio = useCallback(() => {
    setIsPlaying(true)
    if (audioRef.current) {
      audioRef.current.play().catch((e) => {
        console.error('Resume failed:', e)
      })
    }
    mediaControls.updatePlaybackStatus(PlaybackStatus.Playing).catch(console.error)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseAudio()
    } else {
      resumeAudio()
    }
  }, [isPlaying, pauseAudio, resumeAudio])

  const audioContextValue: AudioContextType = {
    currentAudio,
    audioUrl,
    isPlaying,
    playAudio,
    pauseAudio,
    resumeAudio,
    togglePlay,
  }

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
    <AudioContext.Provider value={audioContextValue}>
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
            <Route path="/settings" element={<SettingsPage themeMode={themeMode} setThemeMode={setThemeMode} />} />
          </Routes>
        </div>
        <MiniPlayer />
        <audio ref={audioRef} />
      </div>
    </AudioContext.Provider>
  )
}

const MiniPlayer: FC = () => {
  const { currentAudio, isPlaying, togglePlay } = useAudio()

  if (!currentAudio) return null

  return (
    <div className="mini-player">
      <div className="mini-player-cover">
        <div className="mini-player-placeholder">
          {currentAudio.audio.title.charAt(0)}
        </div>
      </div>
      <div className="mini-player-info">
        <div className="mini-player-title">{currentAudio.audio.title}</div>
      </div>
      <button className="mini-player-btn" onClick={togglePlay}>
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
}

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

export default (props: AppContentProps) => {
  return (
    <Router initialEntries={['/player']}>
      <AppContent {...props} />
    </Router>
  )
}

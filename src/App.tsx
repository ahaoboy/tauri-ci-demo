import { FC, useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { TopNav, PlayerCard, Tab } from './components';
import {
  PlaylistsPage,
  MusicPage,
  SearchPage,
  SettingsPage,
} from './pages';
import { useAppStore } from './store';
import { useSwipe, SwipeDirection } from './hooks';
import './styles/index.less';

// Tab order for navigation
const TAB_ORDER: Tab[] = ['playlists', 'music', 'search', 'settings'];

// Navigation context for child pages to report their state
interface NavigationContextType {
  isInDetailView: boolean;
  setIsInDetailView: (value: boolean) => void;
  onBackFromDetail: (() => void) | null;
  setOnBackFromDetail: (callback: (() => void) | null) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

// Render page based on active tab
const renderPage = (tab: Tab): React.ReactNode => {
  switch (tab) {
    case 'playlists':
      return <PlaylistsPage />;
    case 'music':
      return <MusicPage />;
    case 'search':
      return <SearchPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <MusicPage />;
  }
};

// Main App component
const App: FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('music');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Navigation state for detail views
  const [isInDetailView, setIsInDetailView] = useState(false);
  const [onBackFromDetail, setOnBackFromDetail] = useState<(() => void) | null>(null);

  const {
    loadConfig,
    setAudioElement,
    currentAudio,
    themeMode,
    isConfigLoading,
  } = useAppStore();

  // Initialize app - load config and set audio element
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Set audio element reference
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
    return () => {
      setAudioElement(null);
    };
  }, [setAudioElement]);

  // Handle swipe gesture for tab switching or back navigation
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (direction !== 'left' && direction !== 'right') return;

      // If in detail view, swipe right to go back
      if (isInDetailView && direction === 'right') {
        if (onBackFromDetail) {
          onBackFromDetail();
        }
        return;
      }

      // Normal tab switching
      const currentIndex = TAB_ORDER.indexOf(activeTab);

      if (direction === 'left' && currentIndex < TAB_ORDER.length - 1) {
        // Swipe left - go to next tab
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      } else if (direction === 'right' && currentIndex > 0) {
        // Swipe right - go to previous tab
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    },
    [activeTab, isInDetailView, onBackFromDetail]
  );

  // Get swipe handlers
  const swipeHandlers = useSwipe(handleSwipe, { threshold: 50 });

  // Determine if dark mode
  const isDark = (() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  })();

  // Navigation context value
  const navigationContextValue: NavigationContextType = {
    isInDetailView,
    setIsInDetailView,
    onBackFromDetail,
    setOnBackFromDetail,
  };

  // Loading state
  if (isConfigLoading) {
    return (
      <div className="app">
        <div className="loading-container" style={{ flex: 1 }}>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
        },
      }}
    >
      <AntApp>
        <NavigationContext.Provider value={navigationContextValue}>
          <div
            className="app"
            {...swipeHandlers}
          >
            <TopNav activeTab={activeTab} onChange={setActiveTab} />
            <main className="main-content">{renderPage(activeTab)}</main>
            <PlayerCard audio={currentAudio} />
            <audio ref={audioRef} />
          </div>
        </NavigationContext.Provider>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;

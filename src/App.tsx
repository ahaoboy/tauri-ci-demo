import { FC, useState, useEffect, useRef } from 'react';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { TopNav, PlayerCard, Tab } from './components';
import {
  PlaylistsPage,
  MusicPage,
  SearchPage,
  SettingsPage,
} from './pages';
import { useAppStore } from './store';
import './styles/index.less';

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

  // Determine if dark mode
  const isDark = (() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  })();

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
        <div className="app">
          <TopNav activeTab={activeTab} onChange={setActiveTab} />
          <main className="main-content">{renderPage(activeTab)}</main>
          <PlayerCard audio={currentAudio} />
          <audio ref={audioRef} />
        </div>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;

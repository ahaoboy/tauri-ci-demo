import { useState, type FC } from 'react'
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
      key: '/download',
      title: '下载',
      icon: <SearchOutline />,
    },
    {
      key: '/library',
      title: '音乐库',
      icon: <UnorderedListOutline />,
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

export default () => {
  return (
    <Router initialEntries={['/player']}>
      <div className="app">
        <div className="main-content">
          <Routes>
            <Route path="/download" element={<SearchPage />} />
            <Route path="/player" element={<PlayPage />} />
            <Route path="/library" element={<div />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
        <div className="bottom-nav-wrapper">
          <Bottom />
        </div>
      </div>
    </Router>
  )
}

function PlayerPageWrapper() {
  const [] = useState('')

  return <div />
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

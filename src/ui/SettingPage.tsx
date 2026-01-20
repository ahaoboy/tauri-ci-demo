import { Radio, Space } from 'antd'

interface SettingsPageProps {
  themeMode?: 'light' | 'dark' | 'auto';
  setThemeMode?: (value: 'light' | 'dark' | 'auto') => void;
}

export function SettingsPage({ themeMode = 'auto', setThemeMode }: SettingsPageProps) {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>设置</h1>
        <p>管理应用设置和存储空间</p>
      </div>

      <div className="settings-section">
        <h3>主题设置</h3>
        <Radio.Group
          value={themeMode}
          onChange={(val) => setThemeMode?.(val as 'light' | 'dark' | 'auto')}
        >
          <Space direction="vertical">
            <Radio value="light">浅色主题</Radio>
            <Radio value="dark">深色主题</Radio>
            <Radio value="auto">跟随系统</Radio>
          </Space>
        </Radio.Group>
      </div>
    </div>
  )
}

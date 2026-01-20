import { List, Avatar } from "antd-mobile"
import { useEffect, useState } from "react"
import { get_config, get_loacl_url, LocalAudio } from "../api"
import { useAudio } from "../App"

export const PlayPage = () => {
  const [audios, setAudios] = useState<LocalAudio[]>([])
  const [loading, setLoading] = useState(true)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})
  const { playAudio } = useAudio()

  useEffect(() => {
    const loadAudios = async () => {
      try {
        const config = await get_config()
        setAudios(config.audios || [])

        const urlMap: Record<string, string> = {}
        await Promise.all(
          (config.audios || []).map(async (audio) => {
            if (audio.cover_path) {
              urlMap[audio.audio.id] = await get_loacl_url(audio.cover_path)
            } else if (audio.audio.cover) {
              urlMap[audio.audio.id] = audio.audio.cover
            } else {
              urlMap[audio.audio.id] = ''
            }
          })
        )
        setCoverUrls(urlMap)
      } catch (error) {
        console.error('Failed to load audios:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAudios()
  }, [])

  const handleAudioClick = (audio: LocalAudio) => {
    playAudio(audio,)
  }

  return (
    <List header={`本地音频 (${audios.length})`}>
      {loading ? (
        <List.Item description="加载中...">加载音频数据</List.Item>
      ) : audios.length === 0 ? (
        <List.Item description="暂无音频文件">暂无数据</List.Item>
      ) : (
        audios.map((audio) => (
          <List.Item
            key={audio.audio.id}
            onClick={() => handleAudioClick(audio)}
            prefix={
              <Avatar
                src={coverUrls[audio.audio.id] || ''}
                style={{ '--size': '48px', '--border-radius': '8px' }}
                fallback={<div style={{ width: '48px', height: '48px', backgroundColor: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderRadius: '8px' }}>{audio.audio.title.charAt(0)}</div>}
              />
            }
          >
            {audio.audio.title}
          </List.Item>
        ))
      )}
    </List>
  )
}
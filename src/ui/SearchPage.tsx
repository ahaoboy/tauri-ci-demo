import { Form, List, SearchBar, Checkbox, Button, Space, Image } from "antd-mobile"
import { useRef, useState } from "react"
import { extract_audios, Audio, Playlist, download_audio } from "../api"
import type { FC, PropsWithChildren } from 'react'
import type { CheckboxRef } from 'antd-mobile/es/components/checkbox'

const AudioItemWithCheckbox: FC<
  PropsWithChildren<{
    audio: Audio
  }>
> = props => {
  const checkboxRef = useRef<CheckboxRef>(null)
  return (
    <List.Item
      prefix={
        <div onClick={e => e.stopPropagation()}>
          <Checkbox value={props.audio.id} ref={checkboxRef} />
        </div>
      }
      onClick={() => {
        checkboxRef.current?.toggle()
      }}
      arrow={false}
      extra={
        props.audio.cover && (
          <Image
            src={props.audio.cover}
            width={48}
            height={48}
            style={{ borderRadius: 8 }}
            fit="cover"
          />
        )
      }
    >
      <div>{props.children}</div>
    </List.Item>
  )
}

export const SearchPage = () => {
  const [url, setUrl] = useState('')
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleExtract = async () => {
    if (!url) {
      console.log('请输入 URL')
      return
    }

    setLoading(true)
    try {
      const result = await extract_audios(url)
      setPlaylist(result)
      setSelectedIds([])
      console.log(`提取到 ${result.audios.length} 个音频`)
    } catch (error) {
      console.error('提取失败:', error)
      console.log('提取失败，请检查 URL')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!playlist) return
    if (checked) {
      setSelectedIds(playlist.audios.map(audio => audio.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleDownload = async () => {
    if (!playlist || selectedIds.length === 0) {
      console.log('请先选择要下载的音频')
      return
    }

    setDownloading(true)
    try {
      const selectedAudios = playlist.audios.filter(audio => selectedIds.includes(audio.id))
      let successCount = 0

      for (const audio of selectedAudios) {
        try {
          await download_audio(audio)
          successCount++
        } catch (error) {
          console.error(`下载失败 ${audio.title}:`, error)
        }
      }

      console.log(`成功下载 ${successCount}/${selectedAudios.length} 个音频`)
    } catch (error) {
      console.error('下载失败:', error)
      console.log('下载失败')
    } finally {
      setDownloading(false)
    }
  }

  const indeterminate = playlist ? selectedIds.length > 0 && selectedIds.length < playlist.audios.length : false
  const allChecked = playlist ? selectedIds.length === playlist.audios.length : false

  return (
    <>
      <Form layout="horizontal">
        <Form.Item
          extra={
            <Button
              color="primary"
              size="small"
              onClick={handleExtract}
              loading={loading}
            >
              提取
            </Button>
          }
        >
          <SearchBar
            placeholder="请输入音频链接 URL"
            value={url}
            onChange={setUrl}
          />
        </Form.Item>
      </Form>

      {playlist && (
        <>
          <Space direction="vertical" style={{ padding: 12 }}>
            <Space>
              <Checkbox
                indeterminate={indeterminate}
                checked={allChecked}
                onChange={handleSelectAll}
              >
                全选
              </Checkbox>
              <Button
                color="primary"
                size="small"
                onClick={handleDownload}
                loading={downloading}
                disabled={selectedIds.length === 0}
              >
                下载选中 ({selectedIds.length})
              </Button>
            </Space>
          </Space>

          <Checkbox.Group
            value={selectedIds}
            onChange={v => {
              setSelectedIds(Array.isArray(v) ? v.map(String) : [])
            }}
          >
            <List header={`音频列表 (${playlist.audios.length})`}>
              {playlist.audios.map(audio => (
                <AudioItemWithCheckbox key={audio.id} audio={audio}>
                  {audio.title}
                </AudioItemWithCheckbox>
              ))}
            </List>
          </Checkbox.Group>
        </>
      )}
    </>
  )
}
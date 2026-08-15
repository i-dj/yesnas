import { MediaPlayer } from '@/components/player'
import { getRequestAuthToken } from '@/lib/server/request-context'
import { redirect } from 'next/navigation'

const mediaMimeTypes: Record<string, string> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
  weba: 'audio/webm',
  m4v: 'video/mp4',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  ogv: 'video/ogg',
  webm: 'video/webm',
}

const transcodeExtensions = new Set(['avi', 'flv', 'mkv', 'webm'])
const videoExtensions = new Set(['avi', 'flv', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'webm'])

function getExtension(name?: string) {
  if (!name) return ''
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > -1 ? name.slice(dotIndex + 1).toLowerCase() : ''
}

interface PlayerPageProps {
  searchParams: Promise<{
    storageId?: string
    fileId?: string
    name?: string
    media?: string
  }>
}

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const token = await getRequestAuthToken()
  if (!token) redirect('/login?next=/player')

  const params = await searchParams
  const storageId = params.storageId
  const fileId = params.fileId

  if (!storageId || !fileId) redirect('/storage')

  const title = params.name || '媒体播放'
  const extension = getExtension(title)
  const media = videoExtensions.has(extension) ? 'video' : params.media === 'audio' ? 'audio' : 'video'
  const shouldUseHLS = media === 'video' && transcodeExtensions.has(extension)
  const mimeType = shouldUseHLS ? 'application/vnd.apple.mpegurl' : (mediaMimeTypes[extension] ?? `${media}/*`)
  const contentParams = new URLSearchParams({ storageId, fileId, media, name: title })
  if (shouldUseHLS) contentParams.set('hls', 'manifest')
  const src = `/player/content?${contentParams.toString()}`
  const downloadParams = new URLSearchParams({ storageId, fileId, media, name: title })
  downloadParams.set('download', '1')
  const downloadUrl = `/player/content?${downloadParams.toString()}`
  const stopParams = new URLSearchParams({ storageId, fileId, hls: 'stop' })
  const stopUrl = shouldUseHLS ? `/player/content?${stopParams.toString()}` : undefined

  return (
    <main className="bg-black text-white">
      <MediaPlayer
        src={src}
        kind={media}
        title={title}
        mimeType={mimeType}
        autoPlay
        streamType={shouldUseHLS ? 'hls' : 'file'}
        downloadUrl={downloadUrl}
        downloadName={title}
        stopUrl={stopUrl}
        className="h-dvh w-screen"
      />
    </main>
  )
}

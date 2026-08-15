'use client'

import { cn } from '@/lib/utils'
import Hls from 'hls.js'
import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type MediaPlayerKind = 'audio' | 'video'
export type MediaPlayerStreamType = 'file' | 'hls'

interface MediaPlayerProps {
  src: string
  kind: MediaPlayerKind
  title?: string
  className?: string
  autoPlay?: boolean
  mimeType?: string
  streamType?: MediaPlayerStreamType
  downloadUrl?: string
  downloadName?: string
  stopUrl?: string
}

export function MediaPlayer({
  src,
  kind,
  title,
  className,
  autoPlay = true,
  mimeType,
  streamType = 'file',
  downloadUrl,
  downloadName,
  stopUrl,
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [controlsVisible, setControlsVisible] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || kind !== 'video' || streamType !== 'hls') return

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return
    }

    if (!Hls.isSupported()) return

    const hls = new Hls({
      backBufferLength: 90,
      lowLatencyMode: false,
    })
    hls.loadSource(src)
    hls.attachMedia(video)
    return () => {
      hls.destroy()
      if (stopUrl) navigator.sendBeacon(stopUrl)
    }
  }, [kind, src, stopUrl, streamType])

  if (kind === 'audio') {
    return (
      <div className={cn('bg-card-bg border-card-border flex w-full flex-col gap-5 rounded-xl border p-6', className)}>
        {title ? <h1 className="text-app-text truncate text-xl font-semibold">{title}</h1> : null}
        <audio className="w-full" controls preload="metadata" autoPlay={autoPlay}>
          <source src={src} type={mimeType} />
        </audio>
      </div>
    )
  }

  return (
    <div
      className={cn('relative bg-black', className)}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
      onTouchStart={() => setControlsVisible(true)}
      onFocusCapture={() => setControlsVisible(true)}
      onBlurCapture={() => setControlsVisible(false)}
    >
      {downloadUrl ? (
        <a
          href={downloadUrl}
          download={downloadName}
          className={cn(
            'absolute top-4 right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white/80 backdrop-blur transition hover:bg-black/65 hover:text-white focus-visible:opacity-100',
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          aria-label="下载原文件"
          title="下载原文件"
        >
          <Download className="size-5" />
        </a>
      ) : null}
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        controlsList="nodownload"
        playsInline
        preload="metadata"
        title={title}
        autoPlay={autoPlay}
        src={streamType === 'hls' ? undefined : src}
      >
        {streamType === 'hls' ? null : <source src={src} type={mimeType} />}
      </video>
    </div>
  )
}

export const VideoPlayer = ({ src }: { src: string }) => <MediaPlayer src={src} kind="video" />

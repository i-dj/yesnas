import { fileManagementApi } from '@/lib/api/file-management.api'
import { getRequestAuthToken } from '@/lib/server/request-context'
import type { NextRequest } from 'next/server'

const passthroughHeaders = [
  'accept-ranges',
  'cache-control',
  'content-disposition',
  'content-length',
  'content-range',
  'content-type',
  'etag',
  'last-modified',
]

const contentTypesByExtension: Record<string, string> = {
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

function getFallbackContentType(url: URL) {
  if (url.searchParams.get('hls') === 'manifest') return 'application/vnd.apple.mpegurl'
  if (url.searchParams.get('hls') === 'segment') return 'video/mp2t'
  if (url.searchParams.get('transcode') === '1') return 'video/mp4'

  const media = url.searchParams.get('media')
  const name = url.searchParams.get('name') ?? ''
  const dotIndex = name.lastIndexOf('.')
  const extension = dotIndex > -1 ? name.slice(dotIndex + 1).toLowerCase() : ''
  return contentTypesByExtension[extension] ?? (media === 'audio' ? 'audio/mpeg' : 'video/mp4')
}

function getOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const url = new URL(request.url)
  return `${forwardedProto ?? url.protocol.replace(':', '')}://${forwardedHost ?? url.host}`
}

async function proxyContent(request: NextRequest, method: 'GET' | 'HEAD') {
  const token = await getRequestAuthToken()
  if (!token) return new Response('Unauthorized', { status: 401 })

  const url = new URL(request.url)
  const storageId = url.searchParams.get('storageId')
  const fileId = url.searchParams.get('fileId')
  if (!storageId || !fileId) return new Response('Missing storageId or fileId', { status: 400 })

  const hls = url.searchParams.get('hls')
  const segment = url.searchParams.get('segment')
  const upstreamPath =
    hls === 'manifest'
      ? fileManagementApi.hlsManifestUrl(storageId, fileId)
      : hls === 'segment' && segment
        ? fileManagementApi.hlsSegmentUrl(storageId, fileId, segment)
        : url.searchParams.get('transcode') === '1'
          ? fileManagementApi.playableContentUrl(storageId, fileId)
          : fileManagementApi.contentUrl(storageId, fileId, url.searchParams.get('download') === '1')
  const upstreamUrl = `${getOrigin(request)}${upstreamPath}`
  const upstream = await fetch(upstreamUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(request.headers.get('range') ? { Range: request.headers.get('range')! } : {}),
      ...(request.headers.get('if-range') ? { 'If-Range': request.headers.get('if-range')! } : {}),
      ...(hls !== 'manifest' && request.headers.get('if-none-match')
        ? { 'If-None-Match': request.headers.get('if-none-match')! }
        : {}),
      ...(hls !== 'manifest' && request.headers.get('if-modified-since')
        ? { 'If-Modified-Since': request.headers.get('if-modified-since')! }
        : {}),
    },
    cache: 'no-store',
  })

  const headers = new Headers()
  for (const key of passthroughHeaders) {
    const value = upstream.headers.get(key)
    if (value) headers.set(key, value)
  }
  const contentType = headers.get('content-type')
  if (!contentType || contentType === 'application/octet-stream') {
    headers.set('content-type', getFallbackContentType(url))
  }
  if (url.searchParams.get('download') === '1') {
    const name = url.searchParams.get('name') || 'download'
    headers.set('content-disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
  }

  if (hls === 'manifest' && method === 'GET') {
    if (upstream.status === 304) {
      return new Response(null, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      })
    }

    const manifest = await upstream.text()
    const rewrittenManifest = manifest
      .split('\n')
      .map((line) => {
        const value = line.trim()
        if (!value || value.startsWith('#')) return line

        const params = new URLSearchParams({ storageId, fileId, hls: 'segment', segment: value })
        return `/player/content?${params.toString()}`
      })
      .join('\n')
    headers.delete('content-length')

    return new Response(rewrittenManifest, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  }

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

async function stopHLS(request: NextRequest) {
  const token = await getRequestAuthToken()
  if (!token) return new Response(null, { status: 204 })

  const url = new URL(request.url)
  const storageId = url.searchParams.get('storageId')
  const fileId = url.searchParams.get('fileId')
  if (!storageId || !fileId) return new Response(null, { status: 204 })

  await fetch(`${getOrigin(request)}${fileManagementApi.hlsStopUrl(storageId, fileId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => undefined)

  return new Response(null, { status: 204 })
}

export function GET(request: NextRequest) {
  return proxyContent(request, 'GET')
}

export function HEAD(request: NextRequest) {
  return proxyContent(request, 'HEAD')
}

export function POST(request: NextRequest) {
  return stopHLS(request)
}

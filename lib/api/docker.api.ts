import { BASE } from './base'
import { request } from './request'
import { getClientAuthToken } from '@/lib/auth-session'
import type { DockerComposeProject, DockerImage, DockerImagePullEvent, DockerNetwork, DockerVolume } from '@/types'

interface PullImageStreamOptions {
  command: string
  signal?: AbortSignal
  onEvent: (event: DockerImagePullEvent) => void
}

async function pullImageStream({ command, signal, onEvent }: PullImageStreamOptions) {
  const token = getClientAuthToken()
  const res = await fetch(`${BASE}/docker/images/pull/stream`, {
    method: 'POST',
    cache: 'no-store',
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ command }),
  })

  if (!res.ok || !res.body) {
    const message = await res.text()
    throw new Error(message || '镜像拉取请求失败')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const flush = (chunk: string) => {
    buffer += chunk
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const eventLine = block.split('\n').find((line) => line.startsWith('event: '))
      const dataLine = block.split('\n').find((line) => line.startsWith('data: '))
      if (!dataLine) continue
      const eventName = eventLine?.slice(7).trim()
      const payload = JSON.parse(dataLine.slice(6)) as DockerImagePullEvent | { message?: string }
      if (eventName === 'error') {
        throw new Error('message' in payload && payload.message ? payload.message : '镜像拉取失败')
      }
      onEvent(payload as DockerImagePullEvent)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    flush(decoder.decode(value, { stream: true }))
  }
  flush(decoder.decode())
}

export const dockerApi = {
  containersStreamUrl: (interval = 1) => `${BASE}/docker/containers/stream?interval=${interval}`,
  listImages: () => request<DockerImage[]>('/docker/images', { silentNetworkLoading: true, unwrapList: true }),
  listComposeProjects: () =>
    request<DockerComposeProject[]>('/docker/compose/projects', { silentNetworkLoading: true, unwrapList: true }),
  listNetworks: () => request<DockerNetwork[]>('/docker/networks', { silentNetworkLoading: true, unwrapList: true }),
  listVolumes: () => request<DockerVolume[]>('/docker/volumes', { silentNetworkLoading: true, unwrapList: true }),
  pullImageStream,
}

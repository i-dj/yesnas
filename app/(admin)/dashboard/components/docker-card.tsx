'use client'

import { Container, ExternalLink, RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Card, StatusPill } from '@/components/ui'
import { getDockerContainersStreamUrl } from '@/lib/file-api'
import { cn, formatUptime } from '@/lib/utils'
import { formatCheckedAt } from '../utils'

type DockerContainerSnapshot = {
  id: string
  name: string
  image: string
  state: string
  status: string
  running: boolean
  createdAt: string
  startedAt: string
  finishedAt: string
  uptimeSeconds: number
  cpuPercent: number
  memoryUsageBytes: number
  memoryLimitBytes: number
  memoryPercent: number
  networkRxBytes: number
  networkTxBytes: number
  ports: unknown[]
  mounts: unknown[]
}

type DockerContainersSnapshot = {
  items: DockerContainerSnapshot[]
  checkedAt: string
}

type StreamState = 'connecting' | 'ready' | 'error'

export function DockerCard() {
  const [snapshot, setSnapshot] = useState<DockerContainersSnapshot | null>(null)
  const [streamState, setStreamState] = useState<StreamState>('connecting')
  const [streamVersion, setStreamVersion] = useState(0)

  useEffect(() => {
    let disposed = false
    setStreamState('connecting')

    const source = new EventSource(getDockerContainersStreamUrl(1))

    source.addEventListener('ready', () => {
      if (!disposed) setStreamState('ready')
    })

    source.addEventListener('docker-containers', (event) => {
      try {
        const nextSnapshot = JSON.parse(event.data) as DockerContainersSnapshot
        if (!disposed) {
          setSnapshot(nextSnapshot)
          setStreamState('ready')
        }
      } catch {
        if (!disposed) setStreamState('error')
      }
    })

    source.onerror = () => {
      if (!disposed) setStreamState('error')
    }

    return () => {
      disposed = true
      source.close()
    }
  }, [streamVersion])

  const containers = snapshot?.items ?? []
  const runningCount = containers.filter((container) => container.running).length
  const stoppedCount = containers.length - runningCount
  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-500">
            <Container className="size-3.5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-app-text text-sm font-semibold">Docker 容器</h2>
              <StatusPill
                color={streamState === 'error' ? 'danger' : 'success'}
                content={getStreamLabel(streamState)}
              />
            </div>
            <p className="text-app-text-muted mt-1 text-xs">
              共 {containers.length} 个 · 运行 {runningCount} 个 · 停止 {stoppedCount} 个
              {snapshot ? ` · 最后刷新 ${formatCheckedAt(snapshot.checkedAt)}` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStreamVersion((version) => version + 1)}
          className="border-app-border text-app-text-muted hover:bg-app-hover hover:text-app-text inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs transition"
        >
          <RefreshCw className="size-3.5" />
          重连
        </button>
      </div>

      {containers.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {containers.map((container) => (
            <ContainerTile key={container.id || container.name} container={container} />
          ))}
        </div>
      ) : (
        <div className="border-app-border bg-app-bg text-app-text-muted mt-3 grid min-h-32 place-items-center rounded-lg border text-xs">
          <div className="flex flex-col items-center gap-2">
            {streamState === 'error' ? <WifiOff className="size-5" /> : <Container className="size-5" />}
            <span>{streamState === 'error' ? 'Docker 容器实时流连接失败' : '等待 Docker 容器实时数据'}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

function ContainerTile({ container }: { container: DockerContainerSnapshot }) {
  const webUrl = getContainerWebUrl(container)

  return (
    <div className="border-app-border bg-app-bg flex min-w-0 items-center gap-2.5 rounded-lg border p-2.5">
      <ImageIcon image={container.image} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="text-app-text min-w-0 truncate text-sm font-semibold">{container.name}</h3>
          <span
            className={cn('size-2 shrink-0 rounded-full', container.running ? 'bg-emerald-500' : 'bg-app-text-muted')}
          />
        </div>
        <p className="text-app-text-muted mt-1 truncate text-[11px]">
          {container.running ? formatUptime(container.uptimeSeconds) : getStoppedTime(container)}
        </p>
      </div>

      {webUrl ? (
        <a
          href={webUrl}
          target="_blank"
          rel="noreferrer"
          className="border-app-border text-app-text-muted hover:bg-app-hover hover:text-app-text inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition"
        >
          <ExternalLink className="size-3.5" />
          访问
        </a>
      ) : (
        <StatusPill
          color={container.running ? 'success' : 'neutral'}
          content={container.running ? '运行中' : '已停止'}
          className="shrink-0"
        />
      )}
    </div>
  )
}

function ImageIcon({ image }: { image: string }) {
  const label = getImageInitial(image)

  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sky-500/10 text-xs font-semibold text-sky-400">
      {label || <Container className="size-4" />}
    </span>
  )
}

function getStreamLabel(state: StreamState) {
  if (state === 'connecting') return '连接中'
  if (state === 'error') return '连接异常'
  return '实时'
}

function getStoppedTime(container: DockerContainerSnapshot) {
  if (!container.finishedAt) return container.status || container.state || '未运行'
  return `停止于 ${formatCheckedAt(container.finishedAt)}`
}

function getImageInitial(image: string) {
  const name = image.split('/').pop()?.split(':')[0] ?? ''
  return name.slice(0, 1).toUpperCase()
}

function getContainerWebUrl(container: DockerContainerSnapshot) {
  if (!container.running) return null

  const port = container.ports.map(getPublicWebPort).find((item): item is number => item !== null)
  if (!port) return null

  const host = typeof window === 'undefined' ? 'yesnas' : window.location.hostname || 'yesnas'
  const protocol = port === 443 || port === 8443 ? 'https' : 'http'
  return `${protocol}://${host}:${port}`
}

function getPublicWebPort(port: unknown) {
  if (typeof port === 'string') return parseWebPortFromText(port)
  if (!port || typeof port !== 'object') return null

  const record = port as Record<string, unknown>
  const publicPort = toNumber(record.PublicPort ?? record.publicPort ?? record.hostPort ?? record.host_port)
  const privatePort = toNumber(
    record.PrivatePort ?? record.privatePort ?? record.containerPort ?? record.container_port,
  )
  const candidate = publicPort

  if (!candidate || !privatePort || !isLikelyWebPort(privatePort)) return null
  return candidate
}

function parseWebPortFromText(value: string) {
  const mapped = value.match(/:(\d+)->(?:80|443|3000|5000|8000|8080|8443|9000)\/tcp/i)
  const port = toNumber(mapped?.[1])

  if (!port || !isLikelyWebPort(port)) return null
  return port
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function isLikelyWebPort(port: number) {
  return [80, 443, 3000, 5000, 8000, 8080, 8443, 9000].includes(port)
}

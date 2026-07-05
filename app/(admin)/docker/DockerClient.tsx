'use client'

import {
  Activity,
  Boxes,
  Cpu,
  Database,
  Download,
  Globe2,
  HardDrive,
  MemoryStick,
  MoreHorizontal,
  Network,
  Pause,
  Play,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings2,
  Square,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { ActionMenu, Button, Card, DataTable, Progress, StatusPill, ToggleButton, type DataTableHeader } from '@/components/ui'
import { cn } from '@/lib/utils'
import { dockerContainers, dockerImages, dockerNetworks, dockerOverview, dockerVolumes } from './docker.mock'

type ContainerStatus = 'running' | 'paused' | 'stopped'
type DockerTab = 'overview' | 'containers' | 'images' | 'resources'

interface DockerContainer {
  id: string
  name: string
  image: string
  status: ContainerStatus
  ports: string[]
  cpu: number
  memory: number
  network: string
  uptime: string
  color: string
  sparkline: number[]
}

interface DockerNetwork {
  id: string
  name: string
  driver: string
  subnet: string
  containers: number
  status: 'online' | 'offline'
}

const containers = dockerContainers as DockerContainer[]
const networks = dockerNetworks as DockerNetwork[]

const tabItems = [
  { value: 'overview', label: '概览', icon: Activity },
  { value: 'containers', label: '容器', icon: Boxes },
  { value: 'images', label: '镜像', icon: Download },
  { value: 'resources', label: '网络与卷', icon: Network },
] as const

const statusConfig: Record<ContainerStatus, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  running: { label: 'running', color: 'success' },
  paused: { label: 'paused', color: 'warning' },
  stopped: { label: 'stopped', color: 'danger' },
}

const metricIcons = { cpu: Cpu, memory: MemoryStick, network: Globe2, disk: Database } as const
const metricColors: Record<string, string> = {
  green: 'from-emerald-500 to-green-400',
  blue: 'from-blue-500 to-indigo-400',
  purple: 'from-fuchsia-500 to-purple-400',
  orange: 'from-orange-500 to-amber-400',
}

export function DockerClient() {
  const [tab, setTab] = useState<DockerTab>('overview')
  const [query, setQuery] = useState('')

  const filteredContainers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return containers
    return containers.filter((item) => `${item.name} ${item.image} ${item.ports.join(' ')}`.toLowerCase().includes(keyword))
  }, [query])

  const runningCount = containers.filter((item) => item.status === 'running').length
  const pausedCount = containers.filter((item) => item.status === 'paused').length
  const stoppedCount = containers.filter((item) => item.status === 'stopped').length

  const networkColumns = useMemo<DataTableHeader<DockerNetwork>[]>(
    () => [
      {
        key: 'name',
        label: '网络',
        render: (_, item) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-app-hover grid size-9 shrink-0 place-items-center rounded-lg">
              <Network size={18} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-app-text truncate font-medium">{item.name}</div>
              <div className="text-app-text-muted text-xs">{item.driver}</div>
            </div>
          </div>
        ),
      },
      { key: 'subnet', label: '网段' },
      { key: 'containers', label: '容器', align: 'center', render: (value) => <span className="text-app-text font-semibold">{value}</span> },
      {
        key: 'status',
        label: '状态',
        align: 'right',
        render: (_, item) => <StatusPill color={item.status === 'online' ? 'success' : 'neutral'} content={item.status.toUpperCase()} />,
      },
    ],
    [],
  )

  return (
    <div className="flex min-h-full flex-col gap-6 py-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-app-text-muted mb-2 flex items-center gap-2 text-sm">
            <Boxes size={16} />
            Docker
          </div>
          <h1 className="text-app-text text-3xl font-semibold tracking-tight">Docker 管理</h1>
          <p className="text-app-text-muted mt-2 max-w-2xl text-sm">
            管理容器、镜像、网络和数据卷，快速查看资源占用和运行状态。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Download}>拉取镜像</Button>
          <Button icon={Plus}>创建容器</Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dockerOverview.stats.map((metric) => {
          const Icon = metricIcons[metric.id as keyof typeof metricIcons]
          return (
            <Card key={metric.id} className="bg-app-surface/50">
              <div className="flex items-center gap-4">
                <div className={cn('grid size-10 place-items-center rounded-lg bg-gradient-to-br text-white', metricColors[metric.tone])}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-app-text flex items-center justify-between gap-3 text-sm font-medium">
                    <span>{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                  <Progress value={Number.parseFloat(metric.value)} showLabel={false} className="bg-blue-500" />
                  <div className="text-app-text-muted mt-1 text-xs">{metric.detail}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </section>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ToggleButton items={tabItems} value={tab} onChange={setTab} variant="tabs" shape="rounded" className="bg-app-hover/30 rounded-xl p-1" />
        <div className="flex items-center gap-2">
          <div className="border-app-border bg-app-surface flex h-9 min-w-72 items-center gap-2 rounded-lg border px-3">
            <Search size={16} className="text-app-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索容器、镜像或端口"
              className="text-app-text placeholder:text-app-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <Button variant="ghost" icon={RefreshCw} tip="刷新" />
        </div>
      </section>

      {tab === 'overview' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredContainers.map((container) => <ContainerCard key={container.id} container={container} />)}
          </section>
          <aside className="flex flex-col gap-4">
            <Card className="bg-app-surface/50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-app-text text-lg font-semibold">{dockerOverview.host.name}</h3>
                  <p className="text-app-text-muted mt-1 text-sm">{dockerOverview.host.engine}</p>
                </div>
                <StatusPill color="success" content="HEALTHY" />
              </div>
              <div className="mt-5 grid gap-3">
                <HostMeter label="CPU" value={dockerOverview.host.cpuUsage} />
                <HostMeter label="Memory" value={dockerOverview.host.memoryUsage} />
                <HostMeter label="Docker Disk" value={dockerOverview.host.diskUsage} />
              </div>
            </Card>
            <Card className="bg-app-surface/50">
              <h3 className="text-app-text text-base font-semibold">运行状态</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniCount label="运行中" value={runningCount} color="text-emerald-400" />
                <MiniCount label="已暂停" value={pausedCount} color="text-amber-400" />
                <MiniCount label="已停止" value={stoppedCount} color="text-red-400" />
              </div>
            </Card>
            <Card className="bg-app-surface/50">
              <h3 className="text-app-text text-base font-semibold">最近事件</h3>
              <div className="mt-4 space-y-3">
                {['jellyfin 已重启', 'redis 健康检查通过', 'homepage 镜像更新完成'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="bg-blue-500/20 text-blue-400 grid size-7 place-items-center rounded-full text-xs">{index + 1}</span>
                    <span className="text-app-text-muted text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      )}

      {tab === 'containers' && (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredContainers.map((container) => <ContainerListCard key={container.id} container={container} />)}
        </section>
      )}

      {tab === 'images' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dockerImages.map((image) => (
            <Card key={image.id} className="bg-app-surface/50 overflow-hidden p-0">
              <div className="flex min-h-44">
                <div className={cn('grid w-24 shrink-0 place-items-center text-white', image.accent)}>
                  <Boxes size={34} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-blue-400 text-xs font-semibold uppercase">{image.publisher}</div>
                      <h3 className="text-app-text mt-1 truncate text-lg font-semibold">{image.name}</h3>
                      <p className="text-app-text-muted text-xs">{image.tag}</p>
                    </div>
                    <StatusPill color="neutral" content={image.size} />
                  </div>
                  <p className="text-app-text-muted mt-3 line-clamp-2 text-sm">{image.description}</p>
                  <div className="border-app-border mt-auto flex items-center justify-between border-t pt-3">
                    <span className="text-app-text-muted inline-flex items-center gap-1 text-xs">
                      <Download size={14} />
                      {image.pulls}
                    </span>
                    <Button size="sm" variant="secondary">创建</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      )}

      {tab === 'resources' && (
        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="bg-app-surface/50" title="数据卷">
            <div className="grid gap-3">
              {dockerVolumes.map((volume) => (
                <div key={volume.id} className="bg-app-hover/30 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-app-text font-semibold">{volume.name}</div>
                      <div className="text-app-text-muted mt-1 text-xs">{volume.driver} · {volume.mount}</div>
                    </div>
                    <StatusPill color="neutral" content={volume.size} />
                  </div>
                  <Progress value={volume.used} className="bg-blue-500" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-app-surface/50" title="Docker 网络">
            <DataTable headers={networkColumns} data={networks} variant="plain" />
          </Card>
        </section>
      )}
    </div>
  )
}

function ContainerCard({ container }: { container: DockerContainer }) {
  const status = statusConfig[container.status]
  return (
    <Card className="bg-app-surface/50 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg', container.color)}>
            <Boxes size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-app-text truncate text-lg font-semibold">{container.name}</h3>
            <p className="text-app-text-muted truncate text-sm">{container.image}</p>
          </div>
        </div>
        <ActionMenu
          mode="left-click"
          align="end"
          onAction={(action) => console.info('container action', action, container.id)}
          items={[
            { label: '启动', action: 'start', icon: Play },
            { label: '暂停', action: 'pause', icon: Pause },
            { label: '停止', action: 'stop', icon: Square },
            { label: '重启', action: 'restart', icon: Power, separator: true },
            { label: '设置', action: 'settings', icon: Settings2 },
          ]}
          trigger={<Button variant="ghost" icon={MoreHorizontal} size="sm" />}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <StatusPill color={status.color} content={status.label} />
        <span className="text-app-text-muted text-xs">{container.network}</span>
      </div>
      <Sparkline values={container.sparkline} className="mt-4" />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ResourceBadge label="CPU" value={`${container.cpu}%`} />
        <ResourceBadge label="RAM" value={`${container.memory}%`} />
        <ResourceBadge label="PORTS" value={String(container.ports.length)} />
      </div>
    </Card>
  )
}

function ContainerListCard({ container }: { container: DockerContainer }) {
  const status = statusConfig[container.status]
  return (
    <Card className="bg-app-surface/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn('grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white', container.color)}>
            <Boxes size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-app-text truncate text-lg font-semibold">{container.name}</h3>
              <StatusPill color={status.color} content={status.label} />
            </div>
            <p className="text-app-text-muted mt-1 text-sm">{container.image}</p>
            <div className="text-app-text-muted mt-2 flex flex-wrap gap-2 text-xs">
              <span>{container.ports.length ? container.ports.join(' · ') : 'no exposed ports'}</span>
              <span>Uptime {container.uptime}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" icon={Play}>启动</Button>
          <Button variant="ghost" size="sm" icon={Settings2}>设置</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <HostMeter label="CPU" value={container.cpu} />
        <HostMeter label="Memory" value={container.memory} />
        <HostMeter label="Disk I/O" value={Math.min(container.cpu + container.memory, 100)} />
      </div>
    </Card>
  )
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${34 - (value / max) * 30}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" className={cn('h-10 w-full text-blue-500', className)}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1="35" x2="100" y2="35" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
    </svg>
  )
}

function ResourceBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-hover/40 rounded-lg px-3 py-2 text-center">
      <div className="text-app-text truncate text-sm font-semibold">{value}</div>
      <div className="text-app-text-muted mt-0.5 text-[11px]">{label}</div>
    </div>
  )
}

function HostMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-app-text-muted">{label}</span>
        <span className="text-app-text font-medium">{value}%</span>
      </div>
      <Progress value={value} showLabel={false} className={value > 70 ? 'bg-amber-500' : 'bg-blue-500'} />
    </div>
  )
}

function MiniCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-app-hover/35 rounded-xl p-3 text-center">
      <div className={cn('text-2xl font-semibold tabular-nums', color)}>{value}</div>
      <div className="text-app-text-muted mt-1 text-xs">{label}</div>
    </div>
  )
}

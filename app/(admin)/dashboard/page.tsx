'use client'

import {
  Activity,
  Computer,
  Cpu,
  Database,
  Download,
  Gauge,
  HardDrive,
  MemoryStick,
  Power,
  ShieldCheck,
  Thermometer,
  Upload,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Card, Select } from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { useRealtimeNetwork } from '@/components/layout/realtime-network-context'
import { systemApi } from '@/lib/api/system.api'
import { cn, formatBytes, formatOptionalNumber, formatPercent, formatUptime } from '@/lib/utils'
import { healthLabelMap } from '@/lib/health'
import { CompactResourceCard, FileSharingOverview, NetworkChart } from './components'
import type { NetworkRange } from './types'
import {
  formatCheckedAt,
  formatInterfaceOption,
  formatSpeed,
  statusLabelMap,
} from './utils'
import { NetworkInterfacesSnapshot, SystemStatusSnapshot } from '@/types/models/dashboard'

const networkRanges: Array<{ label: string; value: NetworkRange }> = [
  { label: '实时', value: 'realtime' },
  { label: '1小时', value: '1h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
  { label: '1月', value: '1mo' },
]

const toneClassMap = {
  emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-500 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-300',
  amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-300',
}

export default function DashboardPage() {
  const { data: snapshot } = useSse<SystemStatusSnapshot>('system.status', { interval: 1 })
  const [historicalNetworkSnapshot, setHistoricalNetworkSnapshot] = useState<NetworkInterfacesSnapshot | null>(null)
  const [networkRange, setNetworkRange] = useState<NetworkRange>('realtime')
  const [selectedNetwork, setSelectedNetwork] = useState('all')
  const realtimeNetworkSnapshot = useRealtimeNetwork()
  const networkSnapshot = networkRange === 'realtime' ? realtimeNetworkSnapshot : historicalNetworkSnapshot

  useEffect(() => {
    let disposed = false

    if (networkRange === 'realtime') return

    systemApi
      .network(networkRange)
      .then((nextSnapshot) => {
        if (!disposed) setHistoricalNetworkSnapshot(nextSnapshot)
      })
      .catch(() => {
        if (!disposed) setHistoricalNetworkSnapshot(null)
      })

    return () => {
      disposed = true
    }
  }, [networkRange])

  const summaryCards = useMemo(
    () => [
      {
        title: '系统状态',
        value: snapshot ? statusLabelMap[snapshot.status.state] : '-',
        meta: snapshot ? `已连续运行 ${formatUptime(snapshot.status.uptimeSeconds)}` : '等待接口数据',
        icon: ShieldCheck,
        tone: snapshot?.status.state === 'healthy' ? 'emerald' : snapshot?.status.state === 'warning' ? 'amber' : 'sky',
      },
      {
        title: '系统盘',
        value: snapshot ? formatPercent(snapshot.systemDisk.usagePercent) : '-',
        meta: snapshot
          ? `${formatBytes(snapshot.systemDisk.usedBytes)} / ${formatBytes(snapshot.systemDisk.totalBytes)} · ${
              healthLabelMap[snapshot.systemDisk.health]
            }`
          : '等待接口数据',
        icon: HardDrive,
        tone: snapshot?.systemDisk.health === 'healthy' ? 'sky' : 'amber',
      },
      {
        title: '负载',
        value: snapshot ? snapshot.load.load1.toFixed(2) : '-',
        meta: snapshot
          ? `5分钟 ${snapshot.load.load5.toFixed(2)} · 15分钟 ${snapshot.load.load15.toFixed(2)}`
          : '等待接口数据',
        icon: Activity,
        tone: 'violet',
      },
      {
        title: '磁盘 IO',
        value: snapshot ? formatSpeed(snapshot.diskIo.readBytesPerSec + snapshot.diskIo.writeBytesPerSec) : '-',
        meta: snapshot
          ? `读 ${formatSpeed(snapshot.diskIo.readBytesPerSec)} · 写 ${formatSpeed(snapshot.diskIo.writeBytesPerSec)}`
          : '等待接口数据',
        icon: Database,
        tone: 'amber',
      },
    ],
    [snapshot],
  )

  const gpu = snapshot?.gpu
  const networkInterfaces = useMemo(() => networkSnapshot?.interfaces ?? [], [networkSnapshot])
  const visibleNetworkInterfaces = useMemo(
    () =>
      selectedNetwork === 'all'
        ? networkInterfaces
        : networkInterfaces.filter((networkInterface) => networkInterface.name === selectedNetwork),
    [networkInterfaces, selectedNetwork],
  )
  const networkTrafficTotal = useMemo(
    () =>
      visibleNetworkInterfaces.reduce(
        (total, networkInterface) => ({
          rxBytesPerSec: total.rxBytesPerSec + (networkInterface.speed?.rxBytesPerSec ?? 0),
          txBytesPerSec: total.txBytesPerSec + (networkInterface.speed?.txBytesPerSec ?? 0),
        }),
        { rxBytesPerSec: 0, txBytesPerSec: 0 },
      ),
    [visibleNetworkInterfaces],
  )

  useEffect(() => {
    if (
      selectedNetwork !== 'all' &&
      !networkInterfaces.some((networkInterface) => networkInterface.name === selectedNetwork)
    ) {
      setSelectedNetwork('all')
    }
  }, [networkInterfaces, selectedNetwork])

  return (
    <PageWrapper className="-mx-8 gap-3 overflow-y-auto px-8 pb-8">
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-row gap-3">
          <h1 className="app-page-title text-app-text mb-2">信息中心</h1>
          <div className="text-app-text-muted flex items-center gap-2 text-sm font-medium">
            <span
              className={cn(
                'inline-flex size-2 rounded-full',
                snapshot?.status.state === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500',
              )}
            />
            最后刷新 {snapshot ? formatCheckedAt(snapshot.checkedAt) : '--:--:--'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:items-center sm:gap-0">
          <MiniStatus icon={Power} label="电源" value="AC 供电" />
          <MiniStatus icon={Computer} label="主机名" value="yesnas" />
          <MiniStatus
            icon={Thermometer}
            label="温度"
            value={formatOptionalNumber(snapshot?.cpu.temperatureC, '°C')}
          />
          <MiniStatus icon={Zap} label="功耗" value={formatOptionalNumber(snapshot?.cpu.powerW, ' W')} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-app-text-muted text-sm font-medium">{card.title}</p>
                <p className="text-app-text mt-2 truncate text-xl font-semibold tracking-normal">{card.value}</p>
              </div>
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg',
                  toneClassMap[card.tone as keyof typeof toneClassMap],
                )}
              >
                <card.icon className="size-3.5" />
              </span>
            </div>
            {card.meta && <p className="text-app-text-muted mt-2 truncate text-[13px]">{card.meta}</p>}
          </Card>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <Card className="min-h-80 p-3 xl:col-span-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-app-text text-sm font-semibold">网络带宽</h2>
                <p className="text-app-text-muted mt-1 text-sm">
                  {networkRanges.find((item) => item.value === networkRange)?.label ?? networkRange} ·{' '}
                  {selectedNetwork === 'all' ? '全部网卡' : selectedNetwork}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <NetworkTrafficStat
                  icon={Download}
                  label="接收"
                  value={formatSpeed(networkTrafficTotal.rxBytesPerSec)}
                  className="text-sky-400"
                />
                <NetworkTrafficStat
                  icon={Upload}
                  label="发送"
                  value={formatSpeed(networkTrafficTotal.txBytesPerSec)}
                  className="text-violet-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="border-app-border bg-app-bg inline-flex h-7 w-fit overflow-hidden rounded-md border text-xs">
                {networkRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setNetworkRange(range.value)}
                    className={cn(
                      'px-2.5 transition',
                      networkRange === range.value
                        ? 'bg-app-hover text-sm'
                        : 'text-app-text-muted hover:text-app-text hover:bg-app-hover/60 text-sm',
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <Select
                id="dashboard-network-interface"
                value={selectedNetwork}
                wrapperClassName="w-full sm:w-72"
                className="h-8 bg-transparent text-sm"
                onChange={(event) => setSelectedNetwork(event.target.value)}
              >
                <option value="all">全部网卡</option>
                {networkInterfaces.map((item) => (
                  <option key={item.name} value={item.name}>
                    {formatInterfaceOption(item)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <NetworkChart interfaces={visibleNetworkInterfaces} range={networkRange} />
        </Card>

        <section className="grid gap-3">
          <CompactResourceCard
            icon={Cpu}
            title="CPU"
            value={snapshot ? formatPercent(snapshot.cpu.usagePercent) : '-'}
            color="#0ea5e9"
            percent={snapshot?.cpu.usagePercent ?? 0}
            details={[
              ['核心', snapshot ? `${snapshot.cpu.cores} 核 ${snapshot.cpu.threads} 线程` : '-'],
              ['温度', formatOptionalNumber(snapshot?.cpu.temperatureC, '°C')],
              ['功率', formatOptionalNumber(snapshot?.cpu.powerW, ' W')],
            ]}
          />
          <CompactResourceCard
            icon={MemoryStick}
            title="内存"
            value={snapshot ? formatPercent(snapshot.memory.usagePercent) : '-'}
            color="#8b5cf6"
            percent={snapshot?.memory.usagePercent ?? 0}
            details={[
              ['已用', snapshot ? formatBytes(snapshot.memory.usedBytes) : '-'],
              ['可用', snapshot ? formatBytes(snapshot.memory.availableBytes) : '-'],
            ]}
          />
          <CompactResourceCard
            icon={Gauge}
            title="显卡"
            value={formatPercent(gpu?.usagePercent ?? 0)}
            color="#f59e0b"
            percent={gpu?.usagePercent ?? 0}
            details={[
              ['显存', gpu ? `${formatBytes(gpu.memoryUsedBytes)} / ${formatBytes(gpu.memoryTotalBytes)}` : '-'],
              ['功率', formatOptionalNumber(gpu?.powerW, ' W')],
              ['温度', formatOptionalNumber(gpu?.temperatureC, '°C')],
            ]}
          />
        </section>
      </section>
      <FileSharingOverview fileSharing={snapshot?.fileSharing} />
    </PageWrapper>
  )
}

function MiniStatus({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 sm:px-3">
      <span className="flex items-center gap-1.5">
        <Icon className="text-app-text-muted size-3.5" />
        <span className="text-app-text-muted text-sm">{label}</span>
      </span>
      <span className="text-app-text text-sm font-semibold">{value}</span>
    </div>
  )
}

function NetworkTrafficStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  className: string
}) {
  return (
    <div className="flex min-w-36 items-center gap-2 rounded-md px-2 py-1">
      <span className="border-app-border grid size-8.5 shrink-0 place-items-center rounded-md border">
        <Icon className={cn('size-4 opacity-50', className)} />
      </span>
      <span className="min-w-0">
        <span className="text-app-text-muted block text-xs">{label}</span>
        <span className="text-app-text block truncate text-sm font-semibold tracking-normal">{value}</span>
      </span>
    </div>
  )
}

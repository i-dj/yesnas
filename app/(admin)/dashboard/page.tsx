'use client'

import {
  ChevronDown,
  Computer,
  Cpu,
  Database,
  Download,
  Fan,
  Gauge,
  HardDrive,
  MemoryStick,
  Power,
  ShieldCheck,
  Upload,
  UsersRound,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Card, StatusPill } from '@/components/ui'
import { getSystemNetworkStreamUrl, getSystemNetworkUrl, getSystemStatusStreamUrl } from '@/lib/file-api'
import { cn } from '@/lib/utils'
import { CompactResourceCard, DockerCard, FileSharingOverview, NetworkChart } from './components'
import type { NetworkRange } from './types'
import {
  formatBytes,
  formatCheckedAt,
  formatInterfaceOption,
  formatOptional,
  formatPercent,
  formatSpeed,
  formatUptime,
  healthLabelMap,
  mergeRealtimeNetworkSnapshot,
  processLabelMap,
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
  const [snapshot, setSnapshot] = useState<SystemStatusSnapshot | null>(null)
  const [networkSnapshot, setNetworkSnapshot] = useState<NetworkInterfacesSnapshot | null>(null)
  const [networkRange, setNetworkRange] = useState<NetworkRange>('realtime')
  const [selectedNetwork, setSelectedNetwork] = useState('all')

  useEffect(() => {
    let disposed = false

    const source = new EventSource(getSystemStatusStreamUrl(1))
    source.addEventListener('system-status', (event) => {
      try {
        if (!disposed) setSnapshot(JSON.parse(event.data) as SystemStatusSnapshot)
      } catch {
        // Ignore malformed samples and wait for the next event.
      }
    })

    return () => {
      disposed = true
      source.close()
    }
  }, [])

  useEffect(() => {
    let disposed = false

    if (networkRange !== 'realtime') {
      fetch(getSystemNetworkUrl(networkRange))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch network status: ${response.status}`)
          }

          return response.json() as Promise<NetworkInterfacesSnapshot>
        })
        .then((nextSnapshot) => {
          if (!disposed) setNetworkSnapshot(nextSnapshot)
        })
        .catch(() => {
          if (!disposed) setNetworkSnapshot(null)
        })

      return () => {
        disposed = true
      }
    }

    const source = new EventSource(getSystemNetworkStreamUrl(1))
    source.addEventListener('network-interfaces', (event) => {
      try {
        const nextSnapshot = JSON.parse(event.data) as NetworkInterfacesSnapshot
        if (!disposed) {
          setNetworkSnapshot((currentSnapshot) => mergeRealtimeNetworkSnapshot(currentSnapshot, nextSnapshot))
        }
      } catch {
        // Ignore malformed samples and wait for the next event.
      }
    })

    return () => {
      disposed = true
      source.close()
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
        value: snapshot ? `${formatPercent(snapshot.systemDisk.usagePercent)}` : '-',
        meta: snapshot
          ? `${formatBytes(snapshot.systemDisk.usedBytes)} / ${formatBytes(snapshot.systemDisk.totalBytes)} · ${
              healthLabelMap[snapshot.systemDisk.health]
            }`
          : '等待接口数据',
        icon: HardDrive,
        tone: snapshot?.systemDisk.health === 'healthy' ? 'sky' : 'amber',
      },
      {
        title: '文件共享在线',
        value: snapshot ? `${snapshot.fileSharing.onlineUsers} 人` : '-',
        meta: snapshot
          ? `SMB ${snapshot.fileSharing.services.smb} · WebDAV ${snapshot.fileSharing.services.webdav} · NFS ${snapshot.fileSharing.services.nfs}`
          : '等待接口数据',
        icon: UsersRound,
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
          <h1 className="text-app-text mb-2 text-xl font-semibold tracking-normal">系统仪表台</h1>
          <div className="text-app-text-muted flex items-center gap-2 text-xs font-medium">
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
          <MiniStatus icon={Fan} label="风扇" value={formatOptional(snapshot?.cpu.fanRpm, ' RPM')} />
          <MiniStatus icon={Zap} label="功耗" value={formatOptional(snapshot?.cpu.powerW, ' W')} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-app-text-muted text-xs font-medium">{card.title}</p>
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
            {card.meta && <p className="text-app-text-muted mt-3 truncate text-xs">{card.meta}</p>}
          </Card>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <Card className="min-h-80 p-3 xl:col-span-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-app-text text-sm font-semibold">网络带宽</h2>
                <p className="text-app-text-muted mt-1 text-xs">
                  {networkRanges.find((item) => item.value === networkRange)?.label ?? networkRange} ·{' '}
                  {selectedNetwork === 'all' ? '全部网卡' : selectedNetwork}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <NetworkTrafficStat
                  icon={Download}
                  label="下行"
                  value={formatSpeed(networkTrafficTotal.rxBytesPerSec)}
                  className="text-sky-400"
                />
                <NetworkTrafficStat
                  icon={Upload}
                  label="上行"
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
                        ? 'bg-app-hover text-app-text'
                        : 'text-app-text-muted hover:text-app-text hover:bg-app-hover/60',
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <label className="text-app-text-muted flex items-center text-xs">
                <span className="border-app-border bg-app-bg relative inline-flex h-8 w-full min-w-0 items-center rounded-md border sm:w-72">
                  <select
                    value={selectedNetwork}
                    onChange={(event) => setSelectedNetwork(event.target.value)}
                    className="text-app-text h-full w-full appearance-none bg-transparent px-2.5 pr-7 text-xs outline-none"
                  >
                    <option value="all">全部网卡</option>
                    {networkInterfaces.map((item) => (
                      <option key={item.name} value={item.name}>
                        {formatInterfaceOption(item)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="text-app-text-muted pointer-events-none absolute right-2 size-3" />
                </span>
              </label>
            </div>
          </div>

          <NetworkChart interfaces={visibleNetworkInterfaces} range={networkRange} />
        </Card>

        <section className="grid gap-3">
          <CompactResourceCard
            icon={Cpu}
            title="CPU"
            value={snapshot ? formatPercent(snapshot.cpu.usagePercent) : '-'}
            note={snapshot?.cpu.model ?? '等待接口数据'}
            color="#0ea5e9"
            percent={snapshot?.cpu.usagePercent ?? 0}
            details={[
              ['核心', snapshot ? `${snapshot.cpu.cores} 核 ${snapshot.cpu.threads} 线程` : '-'],
              ['风扇', formatOptional(snapshot?.cpu.fanRpm, ' RPM')],
              ['功率', formatOptional(snapshot?.cpu.powerW, ' W')],
            ]}
          />
          <CompactResourceCard
            icon={MemoryStick}
            title="内存"
            value={snapshot ? formatPercent(snapshot.memory.usagePercent) : '-'}
            note={formatBytes(snapshot ? snapshot.memory.totalBytes : 0)}
            color="#8b5cf6"
            percent={snapshot?.memory.usagePercent ?? 0}
            details={[
              ['已用', snapshot ? formatBytes(snapshot.memory.usedBytes) : '-'],
              ['可用', snapshot ? formatBytes(snapshot.memory.availableBytes) : '-'],
              ['压力', snapshot ? `${snapshot.memory.pressurePercent.toFixed(1)}` : '-'],
            ]}
          />
          <CompactResourceCard
            icon={Gauge}
            title="显卡"
            value={formatPercent(gpu?.usagePercent ?? 0)}
            note={`${gpu?.name ?? '未检测到显卡'} · ${formatOptional(gpu?.temperatureC, '°C')}`}
            color="#f59e0b"
            percent={gpu?.usagePercent ?? 0}
            details={[
              ['显存', gpu ? `${formatBytes(gpu.memoryUsedBytes)} / ${formatBytes(gpu.memoryTotalBytes)}` : '-'],
              ['功率', formatOptional(gpu?.powerW, ' W')],
              ['温度', formatOptional(gpu?.temperatureC, '°C')],
            ]}
          />
        </section>
      </section>
      <FileSharingOverview snapshot={snapshot} />

      <DockerCard />

      <section className="grid gap-3">
        <Card className="overflow-hidden p-0">
          <div className="border-app-border flex items-center justify-between gap-3 border-b p-3">
            <div>
              <h2 className="text-app-text text-sm font-semibold">进程占用</h2>
              <p className="text-app-text-muted mt-1 text-xs">按 CPU 占用排序的关键服务</p>
            </div>
            <Gauge className="text-app-text-muted size-3.5" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="border-app-border text-app-text-muted border-b text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">进程</th>
                  <th className="px-3 py-2 font-medium">CPU</th>
                  <th className="px-3 py-2 font-medium">内存</th>
                  <th className="px-3 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-app-border divide-y">
                {snapshot?.topProcesses.map((process, index) => (
                  <tr key={`${process.name}-${index}`} className="text-app-text">
                    <td className="px-3 py-2 font-mono text-xs">{process.name}</td>
                    <td className="px-3 py-2">{formatPercent(process.cpuPercent)}</td>
                    <td className="px-3 py-2">{formatBytes(process.memoryBytes)}</td>
                    <td className="px-3 py-2">
                      <StatusPill
                        color={
                          process.status === 'waiting'
                            ? 'warning'
                            : process.status === 'running'
                              ? 'success'
                              : 'neutral'
                        }
                        content={processLabelMap[process.status]}
                      />
                    </td>
                  </tr>
                ))}
                {!snapshot && (
                  <tr className="text-app-text-muted">
                    <td className="px-3 py-6 text-center text-xs" colSpan={4}>
                      等待接口数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </PageWrapper>
  )
}

function MiniStatus({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 sm:px-3">
      <span className="flex items-center gap-1.5">
        <Icon className="text-app-text-muted size-3.5" />
        <span className="text-app-text-muted text-xs">{label}</span>
      </span>
      <span className="text-app-text text-xs font-semibold">{value}</span>
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
    <div className="bg-app-bg/70 flex min-w-35 items-center gap-2 rounded-md px-2 py-1">
      <span className="bg-app-hover grid size-7 shrink-0 place-items-center rounded-md">
        <Icon className={cn('size-3.5 opacity-50')} />
      </span>
      <span className="min-w-0">
        <span className="text-app-text-muted block text-[10px]">{label}</span>
        <span className="text-app-text block truncate text-xs font-semibold tracking-normal">{value}</span>
      </span>
    </div>
  )
}

function DiskStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-bg rounded-md px-3 py-2">
      <p className="text-app-text-muted text-[10px]">{label}</p>
      <p className="text-app-text mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  )
}

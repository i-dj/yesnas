'use client'

import { Boxes, Cpu, MemoryStick, Network } from 'lucide-react'

import { Card } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import type { DockerContainersSnapshot } from '@/types'
import { formatCpuPercent, splitMetricValue } from './docker-format'

interface DockerSummaryCardsProps {
  snapshot: DockerContainersSnapshot | null
}

export function DockerSummaryCards({ snapshot }: DockerSummaryCardsProps) {
  const loading = !snapshot
  const containers = snapshot?.items ?? []
  const activeContainers = containers.filter(
    (item) => item.running || item.state === 'paused' || item.status === 'paused',
  )
  const runningCount = containers.filter((item) => item.running).length
  const pausedCount = containers.filter((item) => item.state === 'paused' || item.status === 'paused').length
  const stoppedCount = containers.length - runningCount - pausedCount
  const totalCpuPercent = activeContainers.reduce((total, item) => total + (item.cpuPercent ?? 0), 0)
  const cpuBusyContainerCount = activeContainers.filter((item) => (item.cpuPercent ?? 0) > 0).length
  const totalMemoryUsageBytes = activeContainers.reduce((total, item) => total + (item.memoryUsageBytes ?? 0), 0)
  const totalMemoryLimitBytes = activeContainers.reduce((total, item) => total + (item.memoryLimitBytes ?? 0), 0)
  const totalMemoryPercent = Math.round((totalMemoryUsageBytes / Math.max(totalMemoryLimitBytes, 1)) * 100)
  const memoryUsage = splitMetricValue(bytesFormat(totalMemoryUsageBytes, { standard: 's', decimalPlaces: 1 }))
  const totalNetworkRxBytes = activeContainers.reduce((total, item) => total + (item.networkRxBytes ?? 0), 0)
  const totalNetworkTxBytes = activeContainers.reduce((total, item) => total + (item.networkTxBytes ?? 0), 0)
  const totalNetworkIO = splitMetricValue(
    bytesFormat(totalNetworkRxBytes + totalNetworkTxBytes, { standard: 's', decimalPlaces: 1 }),
  )

  const summaryCards = [
    {
      id: 'containers',
      title: '容器',
      value: loading ? '-' : `${containers.length}`,
      unit: loading ? '' : '个',
      meta: loading ? '等待实时数据' : `${runningCount} 运行中 · ${pausedCount} 暂停 · ${stoppedCount} 停止`,
      icon: Boxes,
      iconClassName: 'text-emerald-400',
    },
    {
      id: 'cpu',
      title: 'CPU 占用',
      value: loading ? '-' : formatCpuPercent(totalCpuPercent),
      unit: loading ? '' : '%',
      meta: loading ? '等待实时数据' : `${cpuBusyContainerCount} 个容器正在消耗 CPU`,
      icon: Cpu,
      iconClassName: 'text-blue-400',
    },
    {
      id: 'memory',
      title: '内存占用',
      value: loading ? '-' : memoryUsage.value,
      unit: loading ? '' : memoryUsage.unit,
      meta: loading
        ? '等待实时数据'
        : `配额 ${bytesFormat(totalMemoryLimitBytes, { standard: 's', decimalPlaces: 1 })} · ${totalMemoryPercent}% 已用`,
      icon: MemoryStick,
      iconClassName: 'text-fuchsia-400',
    },
    {
      id: 'network',
      title: '网络 I/O',
      value: loading ? '-' : totalNetworkIO.value,
      unit: loading ? '' : totalNetworkIO.unit,
      meta: loading
        ? '等待实时数据'
        : `接收 ${bytesFormat(totalNetworkRxBytes, { standard: 's', decimalPlaces: 1 })} · 发送 ${bytesFormat(totalNetworkTxBytes, { standard: 's', decimalPlaces: 1 })}`,
      icon: Network,
      iconClassName: 'text-amber-400',
    },
  ] as const

  return (
    <section className="grid min-h-29 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((metric) => (
        <SummaryCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          unit={metric.unit}
          meta={metric.meta}
          icon={metric.icon}
          iconClassName={metric.iconClassName}
        />
      ))}
    </section>
  )
}

function SummaryCard({
  title,
  value,
  unit,
  meta,
  icon: Icon,
  iconClassName,
}: {
  title: string
  value: string
  unit: string
  meta: string
  icon: any
  iconClassName: string
}) {
  return (
    <Card>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-app-text-muted text-sm font-medium">{title}</div>
          <div className="text-app-text mt-2 flex items-baseline gap-1.5 truncate text-xl font-semibold tracking-normal">
            <span className="tabular-nums">{value}</span>
            {unit ? <span className="text-app-text-muted mb-1 text-sm">{unit}</span> : null}
          </div>
        </div>
        <span className="bg-app-bg border-app-border grid size-9 shrink-0 place-items-center rounded-lg border">
          <Icon className={cn('size-4', iconClassName)} />
        </span>
      </div>
      <div className="text-app-text-muted mt-3 min-h-5 truncate text-[13px]" title={meta}>
        {meta}
      </div>
    </Card>
  )
}

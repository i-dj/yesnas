'use client'

import { Boxes, Play, Square, type LucideIcon } from 'lucide-react'

import { Card, InlineStat } from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { formatStatValue } from '@/lib/utils'
import { OverviewCardHeader } from './overview-card-header'

import type { DockerContainersSnapshot } from '@/types'

export function DockerCard() {
  const { data: snapshot } = useSse<DockerContainersSnapshot>('docker.containers', { interval: 1 })

  const containers = snapshot?.items ?? []
  const runningCount = containers.filter((container) => container.running).length
  const stoppedCount = containers.length - runningCount
  const imageCount = new Set(containers.map((container) => container.image).filter(Boolean)).size
  const loading = !snapshot

  return (
    <Card className="flex min-h-44 flex-col overflow-hidden p-0 xl:col-span-3">
      <OverviewCardHeader icon={Boxes} title="Docker 容器">
        <InlineStat label="镜像" value={formatStatValue(imageCount, loading)} />
        <InlineStat label="容器" value={formatStatValue(containers.length, loading)} divided />
      </OverviewCardHeader>

      <div className="grid flex-1 grid-cols-2">
        <ContainerMetric icon={Play} label="运行中" value={formatStatValue(runningCount, loading)} active />
        <ContainerMetric icon={Square} label="已停止" value={formatStatValue(stoppedCount, loading)} divided />
      </div>
    </Card>
  )
}

function ContainerMetric({
  icon: Icon,
  label,
  value,
  active = false,
  divided = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  active?: boolean
  divided?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 ${divided ? 'border-app-border border-l' : ''}`}>
      <span
        className={`grid size-5 shrink-0 place-items-center ${
          active ? 'text-emerald-500' : 'text-app-text-muted'
        }`}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-app-text text-lg leading-none font-semibold">{value}</div>
        <div className="text-app-text-muted mt-1.5 truncate text-xs">{label}</div>
      </div>
    </div>
  )
}

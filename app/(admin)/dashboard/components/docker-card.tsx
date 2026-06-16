'use client'

import { Card, MetricStat } from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { getDockerContainersStreamUrl } from '@/lib/file-api'

type DockerContainerSnapshot = {
  id: string
  image: string
  running: boolean
}

type DockerContainersSnapshot = {
  items: DockerContainerSnapshot[]
  checkedAt: string
}

export function DockerCard() {
  const { data: snapshot } = useSse<DockerContainersSnapshot>(getDockerContainersStreamUrl(1), {
    events: ['docker-containers'],
  })

  const containers = snapshot?.items ?? []
  const runningCount = containers.filter((container) => container.running).length
  const stoppedCount = containers.length - runningCount
  const imageCount = new Set(containers.map((container) => container.image).filter(Boolean)).size
  const loading = !snapshot

  return (
    <Card className="flex h-full min-h-36 flex-col p-0 xl:col-span-3">
      <div className="border-app-border flex h-17 shrink-0 items-center justify-between gap-3 border-b p-3">
        <div className="min-w-0">
          <h2 className="text-app-text text-sm font-semibold">Docker 容器</h2>
          <p className="text-app-text-muted mt-1 truncate text-xs">镜像与容器运行状态</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MetricStat label="镜像" value={statValue(imageCount, loading)} />
          <MetricStat label="容器" value={statValue(containers.length, loading)} />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2 p-2.5">
        <MetricStat label="运行中" value={statValue(runningCount, loading)} variant="panel" />
        <MetricStat label="已停止" value={statValue(stoppedCount, loading)} variant="panel" />
      </div>
    </Card>
  )
}

function statValue(value: number, loading: boolean) {
  return loading ? '-' : String(value)
}

import { Container, Play, RotateCw, Square, type LucideIcon } from 'lucide-react'

import { Card, StatusPill } from '@/components/ui'
import { cn } from '@/lib/utils'

type DockerContainer = {
  name: string
  image: string
  status: 'running' | 'stopped'
  cpu: string
  memory: string
  ports: string
}

const dockerContainers: DockerContainer[] = []

export function DockerCard() {
  const runningCount = dockerContainers.filter((container) => container.status === 'running').length
  const stoppedCount = dockerContainers.length - runningCount

  return (
    <Card className="p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-sky-500/10 text-sky-500">
            <Container className="size-3.5" />
          </span>
          <div>
            <h2 className="text-app-text text-sm font-semibold">Docker 容器</h2>
            <p className="text-app-text-muted mt-1 text-xs">
              共 {dockerContainers.length} 个 · 运行 {runningCount} 个 · 停止 {stoppedCount} 个
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <DockerStat label="总数" value={dockerContainers.length} />
          <DockerStat label="运行" value={runningCount} tone="success" />
          <DockerStat label="停止" value={stoppedCount} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {dockerContainers.map((container) => (
          <div
            key={container.name}
            className="border-app-border bg-app-bg flex items-center justify-between gap-2 rounded-lg border p-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    container.status === 'running' ? 'bg-emerald-500' : 'bg-app-text-muted',
                  )}
                />
                <p className="text-app-text truncate text-xs font-semibold">{container.name}</p>
                <StatusPill
                  color={container.status === 'running' ? 'success' : 'neutral'}
                  content={container.status === 'running' ? '运行中' : '已停止'}
                />
              </div>
              <p className="text-app-text-muted mt-1 truncate text-xs">{container.image}</p>
              <div className="text-app-text-muted mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span>CPU {container.cpu}</span>
                <span>内存 {container.memory}</span>
                <span>端口 {container.ports}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <ContainerAction icon={Play} label="启动" />
              <ContainerAction icon={Square} label="停止" />
              <ContainerAction icon={RotateCw} label="重启" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DockerStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?: 'success' | 'neutral'
}) {
  return (
    <div className="bg-app-bg rounded-md px-3 py-2 text-center">
      <div className={cn('text-xs font-semibold', tone === 'success' ? 'text-emerald-500' : 'text-app-text')}>
        {value}
      </div>
      <div className="text-app-text-muted text-[10px]">{label}</div>
    </div>
  )
}

function ContainerAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="text-app-text-muted hover:bg-app-hover hover:text-app-text grid size-7 place-items-center rounded-md transition"
    >
      <Icon className="size-3.5" />
    </button>
  )
}

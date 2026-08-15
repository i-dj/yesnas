'use client'

import { Download, Play, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Input, Progress, SideDrawer } from '@/components/ui'
import { cn } from '@/lib/utils'
import { dockerApi } from '@/lib/api/docker.api'
import { toast } from '@/store/use-toast-store'
import type { DockerImagePullEvent } from '@/types'

interface DockerImagePullDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}

const defaultCommand = 'docker pull nginx:latest'

export function DockerImagePullDrawer({ open, onOpenChange, onCompleted }: DockerImagePullDrawerProps) {
  const [command, setCommand] = useState(defaultCommand)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [events, setEvents] = useState<DockerImagePullEvent[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const latestEvent = events.at(-1)
  const canSubmit = command.trim().length > 0 && !running
  const statusText = useMemo(() => {
    if (running) return latestEvent?.message || '正在准备拉取'
    if (latestEvent?.stage === 'completed') return '镜像已拉取完成'
    if (latestEvent?.stage === 'failed') return '镜像拉取失败'
    return '等待输入拉取命令'
  }, [latestEvent, running])

  useEffect(() => {
    if (open) return
    abortRef.current?.abort()
    abortRef.current = null
    setRunning(false)
  }, [open])

  const submit = async () => {
    if (!canSubmit) return

    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setProgress(1)
    setEvents([])

    try {
      await dockerApi.pullImageStream({
        command,
        signal: controller.signal,
        onEvent: (event) => {
          setEvents((items) => [...items, event].slice(-80))
          setProgress(Math.round(event.percent ?? 0))
        },
      })
      toast.success('镜像拉取完成')
      onCompleted?.()
    } catch (error) {
      if (controller.signal.aborted) {
        toast.info('已取消拉取')
      } else {
        const message = error instanceof Error ? error.message : '镜像拉取失败'
        toast.error(message)
        setEvents((items) => [
          ...items,
          {
            stage: 'failed',
            message,
            percent: progress,
            updatedAt: new Date().toISOString(),
          },
        ])
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setRunning(false)
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
  }

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title="拉取镜像" className="p-0">
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-app-border space-y-4 border-b p-4">
          <div className="bg-app-surface/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <span className="bg-app-bg border-app-border grid size-10 shrink-0 place-items-center rounded-md border text-blue-400">
                <Download size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-app-text text-sm font-medium">Docker Pull</div>
                <p className="text-app-text-muted mt-1 text-xs leading-5">
                  支持输入完整命令，例如 docker pull linuxserver/jellyfin:latest，也可以只输入镜像名。
                </p>
              </div>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-app-text-muted text-xs">拉取命令</span>
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="docker pull nginx:latest"
              disabled={running}
              clearable={!running}
            />
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-app-text-muted truncate text-xs">{statusText}</span>
              <span className="text-app-text-muted shrink-0 text-xs tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} showLabel={false} className="bg-blue-500" />
          </div>
        </div>

        <div className="min-h-0 flex-1 p-4">
          <div className="bg-app-bg border-app-border flex h-full min-h-72 flex-col overflow-hidden rounded-lg border">
            <div className="border-app-border flex h-9 shrink-0 items-center justify-between border-b px-3">
              <span className="text-app-text-muted text-xs">执行输出</span>
              <span
                className={cn(
                  'size-2 rounded-full',
                  running && 'bg-blue-400',
                  !running && latestEvent?.stage === 'completed' && 'bg-emerald-400',
                  !running && latestEvent?.stage === 'failed' && 'bg-red-400',
                  !running && !latestEvent && 'bg-app-text-muted/40',
                )}
              />
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 font-mono text-[11px] leading-5">
              {events.length === 0 ? (
                <div className="text-app-text-muted">等待开始...</div>
              ) : (
                events.map((event, index) => (
                  <div
                    key={`${event.updatedAt}-${index}`}
                    className={cn(
                      'break-words',
                      event.stage === 'failed' ? 'text-red-400' : 'text-app-text-muted',
                      event.stage === 'completed' && 'text-emerald-400',
                      event.stage === 'warning' && 'text-amber-400',
                    )}
                  >
                    {event.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-app-border flex shrink-0 items-center justify-end gap-2 border-t p-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={running}>
            关闭
          </Button>
          {running ? (
            <Button type="button" variant="danger" icon={Square} onClick={cancel}>
              取消
            </Button>
          ) : (
            <Button type="button" icon={Play} onClick={submit} disabled={!canSubmit}>
              开始拉取
            </Button>
          )}
        </div>
      </div>
    </SideDrawer>
  )
}

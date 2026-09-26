'use client'

import { Eye, Globe2, MoreHorizontal, Pause, Play, Power, Square, Trash2 } from 'lucide-react'

import { ActionMenu, Button, MiniDonut, StatusPill, type ResourceDataColumn } from '@/components/ui'
import { formatUptime } from '@/lib/utils'
import type { DockerContainer } from '@/types'
import { formatCpuPercent, formatNetworkBytes, getContainerStatus, getWebEntry } from './docker-format'
import { DockerImageIcon } from './docker-image-icon'

const normalizeImageRef = (image: string) => {
  const trimmed = image.trim()
  if (!trimmed) return ''
  return trimmed.split('@')[0] ?? trimmed
}

const formatDonutPercent = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))

export const getDockerContainerColumns = (
  imageIconByRef: Map<string, string>,
): ResourceDataColumn<DockerContainer>[] => [
  {
    key: 'name',
    label: '容器',
    width: '28%',
    render: (_, container) => {
      const imageRef = normalizeImageRef(container.image)
      const webEntry = getWebEntry(container.ports)
      return (
        <div className="flex min-w-0 items-center gap-3">
          <DockerImageIcon icon={imageIconByRef.get(imageRef)} className="bg-app-bg border-app-border size-9 border" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-app-text truncate text-sm font-medium">{container.name}</span>
              {webEntry ? (
                <button
                  type="button"
                  className="bg-theme/10 text-theme hover:bg-theme/15 inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium transition-colors"
                  onClick={(event) => {
                    event.stopPropagation()
                    window.open(`${webEntry.scheme}://${window.location.hostname}:${webEntry.hostPort}`, '_blank')
                  }}
                >
                  <Globe2 className="size-3" />
                  Web
                </button>
              ) : null}
            </div>
            <div className="text-app-text-muted mt-0.5 truncate text-xs" title={container.image}>
              {container.image || '-'}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    key: 'state',
    label: '状态',
    width: '12%',
    render: (_, container) => {
      const status = getContainerStatus(container)
      return <StatusPill color={status.color} content={status.label} className="text-xs font-normal" />
    },
  },
  {
    key: 'cpuPercent',
    label: 'CPU',
    width: '10%',
    align: 'center',
    render: (_, container) => (
      <MiniDonut
        size="sm"
        color="rgb(59 130 246)"
        percent={formatDonutPercent(container.cpuPercent)}
        value={`${formatCpuPercent(container.cpuPercent)}%`}
        ariaLabel={`CPU ${formatCpuPercent(container.cpuPercent)}%`}
      />
    ),
  },
  {
    key: 'memoryPercent',
    label: 'RAM',
    width: '10%',
    align: 'center',
    render: (_, container) => (
      <MiniDonut
        size="sm"
        color="rgb(168 85 247)"
        percent={formatDonutPercent(container.memoryPercent)}
        value={`${Math.round(container.memoryPercent)}%`}
        ariaLabel={`RAM ${Math.round(container.memoryPercent)}%`}
      />
    ),
  },
  {
    key: 'networkRxBytes',
    label: '网络 I/O',
    width: '18%',
    render: (_, container) => (
      <div className="text-app-text-muted flex min-w-0 flex-col gap-1 text-xs leading-4">
        <span className="truncate">↓ {formatNetworkBytes(container.networkRxBytes)}</span>
        <span className="truncate">↑ {formatNetworkBytes(container.networkTxBytes)}</span>
      </div>
    ),
  },
  {
    key: 'uptimeSeconds',
    label: '运行时间',
    width: '14%',
    render: (_, container) => <span className="text-app-text-muted">{formatUptime(container.uptimeSeconds)}</span>,
  },
  {
    key: '__actions__',
    label: '',
    width: '8%',
    align: 'right',
    render: (_, container) => (
      <ActionMenu
        mode="left-click"
        align="end"
        onAction={(action) => console.info('container action', action, container.id)}
        items={[
          { label: '查看', action: 'view', icon: Eye },
          { label: '启动', action: 'start', icon: Play, disabled: container.running },
          { label: '重启', action: 'restart', icon: Power, disabled: !container.running },
          { label: '停止', action: 'stop', icon: Square, disabled: !container.running },
          { label: '暂停', action: 'pause', icon: Pause, disabled: !container.running },
          { label: '删除', action: 'delete', icon: Trash2, isDelete: true, separator: true },
        ]}
        trigger={<Button variant="ghost" icon={MoreHorizontal} size="sm" tip="更多" />}
      />
    ),
  },
]

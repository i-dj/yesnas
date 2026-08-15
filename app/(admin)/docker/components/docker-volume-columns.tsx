'use client'

import { Database } from 'lucide-react'

import { StatusPill, type ResourceDataColumn } from '@/components/ui'
import type { DockerVolume } from '@/types'

export interface DockerVolumeRow extends DockerVolume {
  id: string
}

export const dockerVolumeColumns: ResourceDataColumn<DockerVolumeRow>[] = [
  {
    key: 'name',
    label: '卷',
    width: '34%',
    render: (_, volume) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-app-bg border-app-border grid size-9 shrink-0 place-items-center rounded-md border text-amber-400">
          <Database size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-app-text truncate text-sm font-medium">{volume.name}</div>
          <div className="text-app-text-muted mt-0.5 truncate text-xs">{volume.scope || 'local'}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'driver',
    label: '驱动',
    width: '14%',
    render: (_, volume) => <StatusPill color="neutral" content={volume.driver || '-'} />,
  },
  {
    key: 'mountpoint',
    label: '挂载点',
    width: '38%',
    render: (_, volume) => (
      <span className="text-app-text-muted truncate text-sm" title={volume.mountpoint}>
        {volume.mountpoint || '-'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: '创建时间',
    width: '14%',
    render: (_, volume) => <span className="text-app-text-muted truncate text-sm">{volume.createdAt || '-'}</span>,
  },
]

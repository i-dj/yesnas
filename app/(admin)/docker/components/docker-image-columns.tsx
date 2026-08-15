'use client'

import { Eye, MoreHorizontal, Trash2 } from 'lucide-react'

import { ActionMenu, Button, StatusPill, type ResourceDataColumn } from '@/components/ui'
import type { DockerImage } from '@/types'
import { DockerImageIcon } from './docker-image-icon'

export const dockerImageColumns: ResourceDataColumn<DockerImage>[] = [
  {
    key: 'repository',
    label: '镜像',
    width: '42%',
    render: (_, image) => {
      const name = image.repository || 'untagged'
      return (
        <div className="flex min-w-0 items-center gap-3">
          <DockerImageIcon icon={image.icon} className="bg-app-bg border-app-border border" />
          <div className="min-w-0">
            <div className="text-app-text truncate text-sm font-medium" title={name}>
              {name}
            </div>
            <div className="text-app-text-muted mt-0.5 truncate text-xs" title={image.tag || 'latest'}>
              {image.tag || 'latest'}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    key: 'size',
    label: '大小',
    width: '14%',
    render: (_, image) => <StatusPill color="neutral" content={image.size} />,
  },
  {
    key: 'created',
    label: '创建时间',
    width: '18%',
    render: (_, image) => (
      <span className="text-app-text-muted truncate text-sm">{image.created || image.createdAt || '-'}</span>
    ),
  },
  {
    key: 'id',
    label: '镜像 ID',
    width: '14%',
    render: (_, image) => (
      <span className="text-app-text-muted truncate font-mono text-xs">{image.id.slice(0, 12)}</span>
    ),
  },
  {
    key: '__actions__',
    label: '',
    width: '4%',
    align: 'right',
    render: (_, image) => (
      <ActionMenu
        mode="left-click"
        align="end"
        onAction={(action) => console.info('image action', action, image.id)}
        items={[
          { label: '查看', action: 'view', icon: Eye },
          { label: '删除', action: 'delete', icon: Trash2, isDelete: true, separator: true },
        ]}
        trigger={<Button variant="ghost" icon={MoreHorizontal} size="sm" tip="更多" />}
      />
    ),
  },
]

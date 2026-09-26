'use client'

import { Layers3 } from 'lucide-react'

import { StatusPill, type ResourceDataColumn } from '@/components/ui'
import type { DockerComposeProject } from '@/types'

export const dockerComposeColumns: ResourceDataColumn<DockerComposeProject>[] = [
  {
    key: 'name',
    label: '项目',
    width: '30%',
    render: (_, project) => (
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-app-bg border-app-border grid size-9 shrink-0 place-items-center rounded-lg border text-blue-400">
          <Layers3 size={17} />
        </span>
        <div className="min-w-0">
          <div className="text-app-text truncate text-sm font-medium">{project.name}</div>
          <div className="text-app-text-muted mt-0.5 truncate text-xs">{project.configFiles || '-'}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: '状态',
    width: '18%',
    render: (_, project) => (
      <StatusPill
        color={project.status.toLowerCase().includes('running') ? 'success' : 'neutral'}
        content={project.status || '-'}
      />
    ),
  },
  {
    key: 'services',
    label: '服务',
    width: '12%',
    render: (_, project) => <span className="text-app-text-muted tabular-nums">{project.services || '-'}</span>,
  },
  {
    key: 'workingDir',
    label: '工作目录',
    width: '30%',
    render: (_, project) => (
      <span className="text-app-text-muted truncate text-sm" title={project.workingDir}>
        {project.workingDir || '-'}
      </span>
    ),
  },
  {
    key: 'environment',
    label: '环境',
    width: '10%',
    render: (_, project) => <span className="text-app-text-muted truncate text-sm">{project.environment || '-'}</span>,
  },
]

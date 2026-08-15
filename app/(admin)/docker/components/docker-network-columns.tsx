import { Network } from 'lucide-react'

import { StatusPill, type ResourceDataColumn } from '@/components/ui'
import type { DockerNetwork } from '@/types'

export const dockerNetworkColumns: ResourceDataColumn<DockerNetwork>[] = [
  {
    key: 'name',
    label: '网络',
    width: '28%',
    render: (_, item) => (
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-app-hover grid size-9 shrink-0 place-items-center rounded-lg">
          <Network size={18} className="text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="text-app-text truncate font-medium">{item.name}</div>
          <div className="text-app-text-muted text-xs">{item.driver}</div>
        </div>
      </div>
    ),
  },
  { key: 'subnet', label: '网段', width: '24%' },
  {
    key: 'containers',
    label: '容器',
    width: '16%',
    align: 'center',
    render: (value) => <span className="text-app-text font-semibold">{value}</span>,
  },
  {
    key: '__actions__',
    label: '状态',
    width: '14%',
    align: 'right',
    render: (_, item) => (
      <StatusPill
        color={item.containers > 0 ? 'success' : 'neutral'}
        content={item.containers > 0 ? 'ACTIVE' : 'IDLE'}
      />
    ),
  },
]

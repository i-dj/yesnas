import {
  ActionMenu,
  ActionMenuConfig,
  DataTableHeader,
  MoreButton,
  Progress,
  StatusPill,
  Tooltip,
} from '@/components/ui'
import { ColumnIcon } from '@/components/ui/column-icon'
import { bytesFormat, formatUsagePercent, getProgressColorClass } from '@/lib/utils'
import { StoragePoolModel } from '@/types/models/storage'
import { AlertCircle, ArrowDown, ArrowUp, Camera, Check, Eye, Gauge, Layers, Trash2, Wrench } from 'lucide-react'

export const getStoragePoolColumns = (
  onOpenDetails: (pool: StoragePoolModel) => void,
  onRequestDelete: (pool: StoragePoolModel) => void,
  onRequestBenchmark: (pool: StoragePoolModel) => void,
  onRequestSnapshot: (pool: StoragePoolModel) => void,
  onRequestFormat: (pool: StoragePoolModel) => void,
): DataTableHeader<StoragePoolModel>[] => {
  const getPoolCondition = (pool: StoragePoolModel) => {
    const members = pool.devices ?? []
    const states = members.map((device) => String(device.state || '').toUpperCase())
    const hasOffline = states.includes('OFFLINE')
    const hasDegraded = states.includes('DEGRADED')
    const hasRebuilding = states.includes('REBUILDING') || states.includes('RESYNCING')
    const hasRiskHealth = members.some((device) => {
      const health = String(device.health || '').toLowerCase()
      return health === 'failed' || health === 'fail' || health === 'warning' || health === 'critical'
    })

    if (pool.kind === 'cloud' && !pool.mounted) {
      return {
        label: 'WARNING',
        detail: '云盘本地挂载已断开',
        color: 'warning' as const,
      }
    }
    if (hasOffline) {
      return {
        label: 'WARNING',
        detail: '部分磁盘离线',
        color: 'danger' as const,
      }
    }
    if (hasDegraded || String(pool.status || '').toLowerCase() === 'degraded') {
      return {
        label: 'WARNING',
        detail: '部分磁盘异常',
        color: 'warning' as const,
      }
    }
    if (hasRebuilding) {
      return {
        label: 'WARNING',
        detail: '磁盘正在重建/同步中',
        color: 'warning' as const,
      }
    }
    if (hasRiskHealth) {
      return {
        label: 'WARNING',
        detail: '检测到磁盘健康告警',
        color: 'warning' as const,
      }
    }
    if (String(pool.health || '').toLowerCase() === 'healthy') {
      return {
        label: 'HEALTHY',
        detail: '所有磁盘状态正常',
        color: 'success' as const,
      }
    }
    return {
      label: 'UNKNOWN',
      detail: '状态未知',
      color: 'neutral' as const,
    }
  }

  const makeLabel = (title: string, desc: string) => (
    <span className="leading-tight">
      <span className="block text-[12px] font-medium">{title}</span>
      <span className="text-app-text-muted block text-[10px]">{desc}</span>
    </span>
  )

  const getActionMenuItems = (entry: StoragePoolModel): ActionMenuConfig[] => {
    const isCloud = entry.kind === 'cloud'

    return [
      {
        label: makeLabel('View Details', 'Inspect pool information'),
        action: 'open',
        icon: Eye,
      },
      {
        label: makeLabel('Run Speed Test', 'Measure read/write performance'),
        action: 'speed-test',
        icon: Gauge,
      },
      ...(!isCloud
        ? [
            {
              label: makeLabel('Format Pool', 'Erase and reinitialize filesystem'),
              action: 'format',
              icon: Wrench,
            },
            {
              label: makeLabel('Create Snapshot', 'Create a restore point'),
              action: 'snapshot',
              icon: Camera,
            },
          ]
        : []),
      {
        label: makeLabel('Delete Pool', 'Remove this storage pool'),
        action: 'delete',
        icon: Trash2,
        isDelete: true,
      },
    ]
  }
  return [
    {
      key: 'id',
      label: '',
      width: '222px',
      render: (_, record) => {
        const healthy = String(record.health).toLowerCase() === 'healthy' && (record.kind !== 'cloud' || record.mounted)
        return (
          <ColumnIcon
            icon={Layers}
            title={record.name}
            subTitle={[record.kind === 'local' ? record.raidLevel : null, record.filesystem]
              .filter(Boolean)
              .join(' · ')
              .toUpperCase()}
            badge={{
              icon: healthy ? Check : AlertCircle,
              className: healthy ? 'bg-emerald-500' : 'bg-amber-500',
            }}
          />
        )
      },
    },

    {
      key: 'usagePercent',
      label: 'USAGE',
      width: '250px',

      render: (value, record) => {
        const rawPercent = Number(value) || 0
        const showPercent = formatUsagePercent(record.usedBytes ?? 0, record.totalBytes ?? 0, rawPercent)
        const barPercent = record.usedBytes > 0 && rawPercent < 1 ? 1 : Math.max(0, rawPercent)
        return (
          <div className="space-y-px pr-20">
            <Progress value={barPercent} showLabel={false} className={getProgressColorClass(barPercent)} />
            <div className="text-app-text-muted flex justify-between text-[10px] font-semibold tracking-tighter uppercase">
              <span>
                {bytesFormat(record.usedBytes ?? 0, {
                  standard: 's',
                  decimalPlaces: 2,
                })}{' '}
                /{' '}
                {bytesFormat(record.totalBytes ?? 0, {
                  standard: 's',
                  decimalPlaces: 2,
                })}
              </span>
              <span>{showPercent} </span>
            </div>
          </div>
        )
      },
    },
    {
      key: 'readSpeedBytesPerSec',
      label: 'STATE',
      width: '170px',
      render: (_, record) => (
        <div className="space-y-1 text-xs">
          <div className="text-app-text-muted flex items-center gap-1.5">
            <ArrowDown className="h-3.5 w-3.5 text-sky-400" />
            <span className="uppercase">Read</span>
            <span className="text-app-text ml-auto">
              {record.readSpeedBytesPerSec
                ? `${bytesFormat(record.readSpeedBytesPerSec, {
                    standard: 'm',
                    decimalPlaces: 0,
                  })}/s`
                : '-'}
            </span>
          </div>
          <div className="text-app-text-muted flex items-center gap-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
            <span className="uppercase">Write</span>
            <span className="text-app-text ml-auto">
              {record.writeSpeedBytesPerSec
                ? `${bytesFormat(record.writeSpeedBytesPerSec, {
                    standard: 'm',
                    decimalPlaces: 0,
                  })}/s`
                : '-'}
            </span>
          </div>
        </div>
      ),
    },

    {
      key: 'devices',
      label: 'devices',
      render: (value, record) => (
        <div className="flex flex-col gap-1 text-center">
          <span className="uppercase">{record.kind === 'local' ? record.devices.length : '-'}</span>
          <span className="text-app-text-muted text-xs">Disks</span>
        </div>
      ),
    },
    {
      key: 'snapshotCount',
      label: 'snapshotCount',
      render: (value, record) => (
        <div className="flex flex-col gap-1 text-center">
          <span className="uppercase">{record.kind === 'local' ? record.snapshotCount : '-'}</span>
          <span className="text-app-text-muted text-xs">Snapshot</span>
        </div>
      ),
    },
    {
      key: '__condition__',
      label: 'condition',
      width: '200px',
      render: (_, record) => {
        const condition = getPoolCondition(record)
        return (
          <div className="space-y-1">
            <Tooltip content={condition.detail}>
              <StatusPill color={condition.color} content={condition.label} />
            </Tooltip>
          </div>
        )
      },
    },
    {
      key: '__actions__',
      label: '',
      width: '56px',
      align: 'right',
      render: (_, record) => (
        <ActionMenu
          mode="left-click"
          align="end"
          onAction={(action) => {
            if (action === 'open') {
              onOpenDetails(record)
              return
            }
            if (action === 'speed-test') {
              onRequestBenchmark(record)
              return
            }
            if (action === 'format') {
              onRequestFormat(record)
              return
            }
            if (action === 'snapshot') {
              onRequestSnapshot(record)
              return
            }
            if (action === 'delete') {
              onRequestDelete(record)
            }
          }}
          items={getActionMenuItems(record)}
          trigger={
            <MoreButton
              variant="rowAction"
              className="visible! opacity-100!"
              aria-label={`More actions for ${record.name}`}
              onClick={(event) => {
                event.stopPropagation()
              }}
            />
          }
        />
      ),
    },
  ]
}

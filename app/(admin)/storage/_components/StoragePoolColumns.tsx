import {
  ActionMenu,
  ActionMenuConfig,
  DataTableHeader,
  MoreButton,
  Progress,
} from '@/components/ui'
import { bytesFormat, getProgressColorClass } from '@/lib/utils'
import { StoragePoolModel } from '@/types/models/storage'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Eye,
  Gauge,
  Layers,
  Trash2,
  Wrench,
} from 'lucide-react'

export const getStoragePoolColumns = (
  onOpenDetails: (pool: StoragePoolModel) => void,
  onRequestDelete: (pool: StoragePoolModel) => void,
  onRequestBenchmark: (pool: StoragePoolModel) => void,
): DataTableHeader<StoragePoolModel>[] => {
  const makeLabel = (title: string, desc: string) => (
    <span className="leading-tight">
      <span className="block text-[12px] font-medium">{title}</span>
      <span className="text-app-text-muted block text-[10px]">{desc}</span>
    </span>
  )

  const getActionMenuItems = (entry: StoragePoolModel): ActionMenuConfig[] => [
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
    {
      label: makeLabel('Delete Pool', 'Remove this storage pool'),
      action: 'delete',
      icon: Trash2,
      isDelete: true,
    },
  ]
  return [
    {
      key: 'id',
      label: '',
      width: '72px',
      render: (_, record) => {
        const healthy = String(record.health).toLowerCase() === 'healthy'
        return (
          <div className="border-app-border bg-app-bg relative z-10 mb-0.5 inline-flex items-center justify-center overflow-visible rounded-full border p-2">
            <Layers className="h-4.5 w-4.5" />
            <span
              className={
                healthy
                  ? 'absolute -right-1 -bottom-0.5 z-20 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white'
                  : 'absolute -right-1 -bottom-0.5 z-20 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white'
              }
            >
              {healthy ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <AlertCircle className="h-2.5 w-2.5" />
              )}
            </span>
          </div>
        )
      },
    },
    {
      key: 'name',
      label: 'NAME',
      render: (value, record) => (
        <div className="min-w-0">
          <div className="truncate font-semibold">{value}</div>
          <div className="text-app-text-muted mt-0.5 truncate text-xs uppercase">
            {record.raidLevel} · {record.filesystem}
          </div>
        </div>
      ),
    },
    {
      key: 'usagePercent',
      label: 'USAGE',
      width: '250px',

      render: (value, record) => {
        return (
          <div className="space-y-px pr-20">
            <Progress
              value={value}
              showLabel={false}
              className={getProgressColorClass(value)}
            />
            <div className="text-app-text-muted flex justify-between text-[10px] font-semibold tracking-tighter uppercase">
              <span>
                {bytesFormat(record.usedBytes ?? 0, { standard: 'm', decimalPlaces: 2 })} /{' '}
                {bytesFormat(record.totalBytes ?? 0, { standard: 'm', decimalPlaces: 2 })}
              </span>
              <span>{value}%</span>
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
                ? `${bytesFormat(record.readSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })}/s`
                : '-'}
            </span>
          </div>
          <div className="text-app-text-muted flex items-center gap-1.5">
            <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
            <span className="uppercase">Write</span>
            <span className="text-app-text ml-auto">
              {record.writeSpeedBytesPerSec
                ? `${bytesFormat(record.writeSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })}/s`
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
          <span className="uppercase">{record.devices.length}</span>
          <span className="text-app-text-muted text-xs">Disks</span>
        </div>
      ),
    },
    {
      key: 'snapshotCount',
      label: 'snapshotCount',
      render: (value, record) => (
        <div className="flex flex-col gap-1 text-center">
          <span className="uppercase">{record.snapshotCount}</span>
          <span className="text-app-text-muted text-xs">Snapshot</span>
        </div>
      ),
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
              console.log('format pool:', record.id)
              return
            }
            if (action === 'snapshot') {
              console.log('create snapshot pool:', record.id)
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

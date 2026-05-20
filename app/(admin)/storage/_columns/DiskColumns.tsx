import { DataTableHeader, MoreButton, StatusPill } from '@/components/ui'
import { HardDrive, MemoryStick } from 'lucide-react'
import { DiskModel } from '@/types/models/storage'
import { bytesFormat } from '@/lib/utils'

export const getDiskColumns = (
  _selectedIds: Set<string>,
  onOpenDetails: (disk: DiskModel) => void,
): DataTableHeader<DiskModel>[] => [
  {
    key: 'transport',
    label: 'NAME',
    width: '60px',
    sortable: true,
    render: (value, record) => (
      <div className="flex items-center gap-3">
        <div className="border-app-border bg-app-bg-muted rounded-full border p-2">
          {String(value).toLowerCase() === 'nvme' ? (
            <MemoryStick className="h-4.5 w-4.5" />
          ) : (
            <HardDrive className="h-4.5 w-4.5" />
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'model',
    label: 'MODEL',
    width: '260px',
    render: (value, record) => (
      <div className="min-w-0">
        <div className="truncate">{value}</div>
        <div className="text-app-text-muted mt-0.5 truncate text-xs">
          SN: {record.serial}
        </div>
      </div>
    ),
  },

  {
    key: 'sizeBytes',
    label: 'SIZE',
    render: (value) => (
      <span className="text-base font-semibold">
        {bytesFormat(value, { standard: 'm', decimalPlaces: 0 })}
      </span>
    ),
  },
  {
    key: 'fsType',
    label: 'PARTITION',
    render: (_, record) => (
      <span className="text-app-text-muted text-xs">
        <div className="min-w-0">
          <StatusPill
            color={record.inUse ? 'warning' : 'success'}
            content={record.inUse ? '已使用' : '未使用'}
          />
        </div>
      </span>
    ),
  },
  {
    key: 'path',
    label: 'SIZE',
    render: (value) => <span className="">{value}</span>,
  },
  {
    key: 'temperatureC',
    label: 'SIZE',
    render: (value) => <span className="">{value}°C</span>,
  },
  {
    key: 'health',
    label: 'HEALTH',
    render: (value) => {
      const health = String(value || '-').toLowerCase()
      const passed = health === 'passed'
      return (
        <span className={passed ? 'text-emerald-500' : 'text-red-500'}>
          {String(value || '-').toUpperCase()}
        </span>
      )
    },
  },
  {
    key: '__actions__',
    label: '',
    width: '56px',
    align: 'right',
    render: (_, record) => (
      <div className="flex justify-end">
        <MoreButton
          variant="rowAction"
          aria-label={`More actions for ${record.path}`}
          onClick={(event) => {
            event.stopPropagation()
            onOpenDetails(record)
          }}
        />
      </div>
    ),
  },
]

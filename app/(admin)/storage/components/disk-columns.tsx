import { DataTableHeader, MoreButton, StatusPill } from '@/components/ui'
import { HardDrive, MemoryStick } from 'lucide-react'
import { DiskModel } from '@/types/models/storage'
import { bytesFormat } from '@/lib/utils'
import { ColumnIcon } from '@/components/ui/column-icon'

export const getDiskColumns = (
  _selectedIds: Set<string>,
  onOpenDetails: (disk: DiskModel) => void,
): DataTableHeader<DiskModel>[] => [
  {
    key: 'transport',
    label: 'NAME',
    width: '300px',
    sortable: true,
    render: (value, record) => (
      <ColumnIcon
        icon={String(record.transport).toLowerCase() === 'nvme' ? MemoryStick : HardDrive}
        title={String(record.model)}
        subTitle={[record.serial ? `SN: ${record.serial}` : null].filter(Boolean).join(' · ')}
      />
    ),
  },

  {
    key: 'sizeBytes',
    label: 'SIZE',
    render: (value) => (
      <span className="text-base font-semibold">{bytesFormat(value, { standard: 'm', decimalPlaces: 0 })}</span>
    ),
  },
  {
    key: 'fsType',
    label: 'PARTITION',
    render: (_, record) => (
      <span className="text-app-text-muted text-xs">
        <div className="min-w-0">
          <StatusPill color={record.inUse ? 'warning' : 'success'} content={record.inUse ? '已使用' : '未使用'} />
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
      return <span className={passed ? 'text-emerald-500' : 'text-red-500'}>{String(value || '-').toUpperCase()}</span>
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

import {
  ActionMenu,
  ActionMenuConfig,
  Button,
  DataTableHeader,
  MoreButton,
  Progress,
  StatusPill,
  Tooltip,
} from '@/components/ui'
import { ColumnIcon } from '@/components/ui/column-icon'
import { bytesFormat, formatUsagePercent, getProgressColorClass } from '@/lib/utils'
import { isHealthyHealth } from '@/lib/health'
import { StoragePoolModel } from '@/types/models/storage'
import { getCloudProviderKey, getStoragePoolCondition } from '../utils'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Camera,
  Check,
  Cloud,
  Eye,
  Gauge,
  Layers,
  MoreHorizontal,
  MoreVertical,
  Trash2,
  Wrench,
} from 'lucide-react'

function CloudStorageLogo({ className, src }: { className?: string; src: string }) {
  return <img src={src} alt="" aria-hidden="true" className={className} />
}

const GoogleDriveLogo = ({ className }: { className?: string }) => (
  <CloudStorageLogo src="/logos/cloud-storage/google-drive.png" className={className} />
)

const OneDriveLogo = ({ className }: { className?: string }) => (
  <CloudStorageLogo src="/logos/cloud-storage/onedrive.svg" className={className} />
)

const DropboxLogo = ({ className }: { className?: string }) => (
  <CloudStorageLogo src="/logos/cloud-storage/dropbox.png" className={className} />
)

export const getStoragePoolColumns = (
  onOpenDetails: (pool: StoragePoolModel) => void,
  onRequestDelete: (pool: StoragePoolModel) => void,
  onRequestBenchmark: (pool: StoragePoolModel) => void,
  onRequestSnapshotManager: (pool: StoragePoolModel) => void,
  onRequestFormat: (pool: StoragePoolModel) => void,
): DataTableHeader<StoragePoolModel>[] => {
  const makeLabel = (title: string) => (
    <span className="leading-tight">
      <span className="block text-[14px]">{title}</span>
    </span>
  )

  const getActionMenuItems = (entry: StoragePoolModel): ActionMenuConfig[] => {
    const isCloud = entry.kind === 'cloud'

    return [
      {
        label: makeLabel('View Details'),
        action: 'open',
        icon: Eye,
      },
      {
        label: makeLabel('Run Speed Test'),
        action: 'speed-test',
        icon: Gauge,
      },
      ...(!isCloud
        ? [
            {
              label: makeLabel('Format Pool'),
              action: 'format',
              icon: Wrench,
            },
            {
              label: makeLabel('快照管理'),
              action: 'snapshot-manager',
              icon: Camera,
            },
          ]
        : []),
      {
        label: makeLabel('Delete Pool'),
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
        const cloudProvider = record.kind === 'cloud' ? getCloudProviderKey(record) : null
        const iconConfig =
          cloudProvider === 'google-drive'
            ? { icon: GoogleDriveLogo, className: 'object-contain' }
            : cloudProvider === 'dropbox'
              ? { icon: DropboxLogo, className: 'object-contain' }
              : cloudProvider === 'onedrive'
                ? { icon: OneDriveLogo, className: 'object-contain' }
                : { icon: Layers, className: undefined }
        const healthy = isHealthyHealth(record.health) && (record.kind !== 'cloud' || record.mounted)
        return (
          <ColumnIcon
            icon={iconConfig.icon}
            iconClassName={iconConfig.className}
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
            <div className="text-app-text-muted flex justify-between text-[12px] font-semibold tracking-tighter">
              <span className="inline-flex items-center gap-1">
                <span>
                  {bytesFormat(record.usedBytes, {
                    standard: 's',
                    decimalPlaces: 2,
                  })}
                </span>
                <span>/</span>
                <span>
                  {bytesFormat(record.totalBytes, {
                    standard: 's',
                    decimalPlaces: 2,
                  })}
                </span>
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
        <div className="space-y-1 text-[13px]">
          <div className="text-app-text-muted flex items-center gap-3">
            <span >Read Speed</span>
            <span className="text-app-text ">
              {record.readSpeedBytesPerSec
                ? `${bytesFormat(record.readSpeedBytesPerSec, {
                    standard: 'm',
                    decimalPlaces: 2,
                  })}/s`
                : '-'}
            </span>
          </div>
          <div className="text-app-text-muted flex items-center gap-3">
            <span >Write Speed</span>
            <span className="text-app-text">
              {record.writeSpeedBytesPerSec
                ? `${bytesFormat(record.writeSpeedBytesPerSec, {
                    standard: 'm',
                    decimalPlaces: 2,
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
          <span className="uppercase">{record.kind === 'local' ? (record.devices?.length ?? 0) : '-'}</span>
          <span className="text-app-text-muted text-[13px]">Disks</span>
        </div>
      ),
    },
    {
      key: 'snapshotCount',
      label: 'snapshotCount',
      render: (value, record) => (
        <div className="flex flex-col gap-1 text-center">
          <span className="uppercase">{record.kind === 'local' ? (record.snapshotCount ?? 0) : '-'}</span>
          <span className="text-app-text-muted text-[13px]">Snapshot</span>
        </div>
      ),
    },
    {
      key: 'health',
      label: 'condition',
      width: '200px',
      render: (_, record) => {
        const condition = getStoragePoolCondition(record)
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
        <div className="flex justify-end opacity-80 transition-opacity group-hover:opacity-100">
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
              if (action === 'snapshot-manager') {
                onRequestSnapshotManager(record)
                return
              }
              if (action === 'delete') {
                onRequestDelete(record)
              }
            }}
            items={getActionMenuItems(record)}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                icon={MoreHorizontal}
                className="visible! opacity-100!"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              />
            }
          />
        </div>
      ),
    },
  ]
}

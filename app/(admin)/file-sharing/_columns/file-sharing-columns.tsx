import { Button, type DataTableHeader } from '@/components/ui'
import { cn, formatDateTime } from '@/lib/utils'
import { Edit3, FolderInput, Globe2, HardDriveDownload, Network, UploadCloud, type LucideIcon } from 'lucide-react'

import type { ProtocolKey, SharedFolder } from '../_types'

type Translate = (key: string, values?: Record<string, string | number>) => string

const protocolIcons = {
  smb: HardDriveDownload,
  ftp: UploadCloud,
  webdav: Globe2,
  nfs: Network,
} satisfies Record<ProtocolKey, LucideIcon>

interface GetFileSharingColumnsParams {
  t: Translate
  onEdit: (share: SharedFolder) => void
  onDelete: (share: SharedFolder) => void
}

export function getFileSharingColumns({
  t,
  onEdit,
  onDelete,
}: GetFileSharingColumnsParams): DataTableHeader<SharedFolder>[] {
  return [
    {
      key: 'name',
      label: t('columns.name'),
      width: 'auto',
      render: (_, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="border-app-border bg-app-bg inline-flex size-8 shrink-0 items-center justify-center rounded-full border">
            <FolderInput className="size-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="text-app-text truncate text-sm font-medium">{record.name}</div>
              <div className="flex shrink-0 flex-wrap gap-1">
                {record.protocols.map((protocol) => {
                  const Icon = protocolIcons[protocol]
                  return (
                    <span
                      key={protocol}
                      className="bg-app-hover text-app-text inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      <Icon className="size-2.5" />
                      {t(`protocols.${protocol}.name`)}
                    </span>
                  )
                })}
              </div>
            </div>
            <div className="text-app-text-muted mt-0.5 flex min-w-0 items-center gap-2 text-xs">
              <span className="truncate">{record.path}</span>
              {record.clientNetworks.length > 0 ? (
                <span className="shrink-0 truncate">
                  {t('columns.clientNetworks')}: {record.clientNetworks.join(', ')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      width: '96px',
      sortable: true,
      render: (_, record) => {
        const value = record.status
        return (
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-1 text-[11px] font-medium',
              value === 'enabled' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500',
            )}
          >
            {t(`status.${value}`)}
          </span>
        )
      },
    },
    {
      key: 'updatedAt',
      label: t('columns.updatedAt'),
      width: '150px',
      render: (_, record) => (
        <span className="text-app-text-muted text-xs">{formatDateTime(record.updatedAt, 'Asia/Shanghai')}</span>
      ),
    },
    {
      key: '__actions__',
      label: '',
      width: '90px',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit3}
            tip={t('actions.edit')}
            aria-label={t('actions.edit')}
            onClick={(event) => {
              event.stopPropagation()
              onEdit(record)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            isDelete
            tip={t('actions.delete')}
            aria-label={t('actions.delete')}
            onClick={(event) => {
              event.stopPropagation()
              onDelete(record)
            }}
          />
        </div>
      ),
    },
  ]
}

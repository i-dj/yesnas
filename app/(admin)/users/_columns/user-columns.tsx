import { Button, type DataTableHeader } from '@/components/ui'
import { cn, formatDateTime } from '@/lib/utils'
import type { SmbStatus, User, UserStatus } from '@/types'
import { Edit3, ShieldCheck, Trash2 } from 'lucide-react'
import type { useTranslations } from 'next-intl'

import { UserAvatar } from '../_components/user-avatar'

const statusClassNames = {
  active: 'bg-emerald-500/10 text-emerald-500',
  disabled: 'bg-zinc-500/10 text-zinc-500',
} satisfies Record<UserStatus, string>

const smbStatusClassNames = {
  enabled: 'bg-sky-500/10 text-sky-500',
  disabled: 'bg-zinc-500/10 text-zinc-500',
  error: 'bg-red-500/10 text-red-500',
} satisfies Record<SmbStatus, string>

interface GetUserColumnsParams {
  t: ReturnType<typeof useTranslations>
  timeZone: string
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function getUserColumns({ t, timeZone, onEdit, onDelete }: GetUserColumnsParams): DataTableHeader<User>[] {
  return [
    {
      key: 'username',
      label: t('columns.user'),
      width: '320px',
      sortable: true,

      render: (_, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={record} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="text-app-text truncate font-medium">{record.displayName || record.username}</div>
              {record.isAdmin ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                  <ShieldCheck className="h-3 w-3" />
                  {t('roles.admin')}
                </span>
              ) : null}
            </div>
            <div className="text-app-text-muted truncate text-xs">{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      width: '140px',
      sortable: true,

      render: (value: UserStatus) => (
        <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-medium', statusClassNames[value])}>
          {t(`statuses.${value}`)}
        </span>
      ),
    },
    {
      key: 'smbUsername',
      label: t('columns.smb'),
      width: '220px',
      sortable: true,

      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <span className="text-app-text">{record.smbUsername}</span>
          <span
            className={cn(
              'inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium',
              smbStatusClassNames[record.smbStatus],
            )}
          >
            {t(`smbStatuses.${record.smbStatus}`)}
          </span>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      sortable: true,
      label: t('columns.updatedAt'),
      width: '220px',
      render: (_, record) => <span className="text-app-text-muted">{formatDateTime(record.updatedAt, timeZone)}</span>,
    },
    {
      key: '__actions__',
      label: '',
      width: '88px',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            icon={Edit3}
            tip={t('actions.edit')}
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

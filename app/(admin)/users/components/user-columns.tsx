import { Button, Tooltip, type DataTableHeader } from '@/components/ui'
import { cn, formatSmartTimeInfo } from '@/lib/utils'
import type { EnableStatus, User } from '@/types'
import { Edit3, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import type { useTranslations } from 'next-intl'

import { UserAvatar } from './user-avatar'

const statusClassNames = {
  enabled: 'bg-emerald-500/10 text-emerald-500',
  disabled: 'bg-zinc-500/10 text-zinc-500',
} satisfies Record<EnableStatus, string>

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
      width: '280px',
      sortable: true,

      render: (_, record) => (
        <div className="flex min-w-0 items-center gap-3 py-1">
          <UserAvatar user={record} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="text-app-text truncate font-medium">{record.displayName || record.username}</div>
            </div>
            <div className="text-app-text-muted mt-0.5 truncate text-xs">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      width: '140px',
      sortable: true,

      render: (value: EnableStatus) => (
        <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-medium', statusClassNames[value])}>
          {t(`statuses.${value}`)}
        </span>
      ),
    },
    {
      key: 'isAdmin',
      label: t('columns.role'),
      width: '140px',
      sortable: true,

      render: (value: boolean) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            value ? 'bg-amber-500/15 text-amber-600' : 'bg-zinc-500/10 text-zinc-500',
          )}
        >
          {value ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
          {value ? t('roles.admin') : t('roles.user')}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      sortable: true,
      label: t('columns.updatedAt'),
      width: '220px',
      render: (_, record) => {
        const updatedAtText = formatSmartTimeInfo(record.updatedAt, timeZone)

        return (
          <Tooltip content={updatedAtText.fullText} disabled={!updatedAtText.showTooltip} triggerClassName="w-fit">
            <span className="text-app-text-muted inline-flex w-fit items-center gap-2 text-xs">
              {updatedAtText.text}
            </span>
          </Tooltip>
        )
      },
    },
    {
      key: '__actions__',
      label: '',
      width: '88px',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
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

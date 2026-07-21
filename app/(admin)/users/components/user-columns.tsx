import { Button, Pill, RelativeTime, StatusPill, type DataTableHeader } from '@/components/ui'
import type { EnableStatus, User } from '@/types'
import { Edit3, ShieldCheck, UserRound } from 'lucide-react'
import type { useTranslations } from 'next-intl'

import { UserAvatar } from './user-avatar'

const statusPillColors = {
  enabled: 'success',
  disabled: 'neutral',
} satisfies Record<EnableStatus, 'success' | 'neutral'>

interface GetUserColumnsParams {
  t: ReturnType<typeof useTranslations>
  timeZone: string
  now?: string
  locale: string
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function getUserColumns({
  t,
  timeZone,
  now,
  locale,
  onEdit,
  onDelete,
}: GetUserColumnsParams): DataTableHeader<User>[] {
  return [
    {
      key: 'username',
      label: t('columns.user'),
      width: '180px',
      sortable: true,

      render: (_, record) => (
        <div className="flex min-w-0 items-center gap-3 py-1">
          <UserAvatar user={record} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="text-app-text truncate text-sm">{record.displayName || record.username}</div>
            </div>
            <div className="text-app-text-muted mt-0.5 truncate text-xs">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      width: '80px',
      sortable: true,

      render: (_, record) => (
        <StatusPill color={statusPillColors[record.status]} content={t(`statuses.${record.status}`)} />
      ),
    },
    {
      key: 'isAdmin',
      label: t('columns.role'),
      width: '140px',
      sortable: true,

      render: (_, record) => (
        <StatusPill
          color={record.isAdmin ? 'warning' : 'neutral'}
          icon={record.isAdmin ? ShieldCheck : UserRound}
          content={record.isAdmin ? t('roles.admin') : t('roles.user')}
        />
      ),
    },
    {
      key: 'groups',
      label: t('columns.groups'),
      render: (_, record) => {
        const groups = record.groups ?? []
        return groups.length ? (
          <div className="flex flex-wrap gap-1.5">
            {groups.slice(0, 3).map((group) => (
              <Pill key={group.id} variant="plain" className="h-auto px-2 py-1 text-xs">
                {group.name}
              </Pill>
            ))}
            {groups.length > 3 ? (
              <Pill variant="plain" className="h-auto px-2 py-1 text-xs">
                +{groups.length - 3}
              </Pill>
            ) : null}
          </div>
        ) : (
          <span className="text-app-text-muted text-xs">{t('groups.none')}</span>
        )
      },
    },
    {
      key: 'updatedAt',
      sortable: true,
      label: t('columns.updatedAt'),
      width: '180px',
      render: (_, record) => (
        <RelativeTime
          value={record.updatedAt}
          locale={locale}
          timeZone={timeZone}
          now={now}
          className="text-app-text-muted inline-flex w-fit items-center gap-2 text-sm"
        />
      ),
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

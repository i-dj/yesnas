import { Button, RelativeTime, StatusPill, Tooltip, type DataTableHeader } from '@/components/ui'
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
      width: '28%',
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
      width: '12%',
      sortable: true,

      render: (_, record) => (
        <StatusPill color={statusPillColors[record.status]} content={t(`statuses.${record.status}`)} />
      ),
    },
    {
      key: 'isAdmin',
      label: t('columns.role'),
      width: '14%',
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
      width: '22%',
      render: (_, record) => <UserGroupsCell groups={record.groups ?? []} emptyLabel={t('groups.none')} />,
    },
    {
      key: 'updatedAt',
      sortable: true,
      label: t('columns.updatedAt'),
      width: '16%',
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
      width: '8%',
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

function UserGroupsCell({ groups, emptyLabel }: { groups: NonNullable<User['groups']>; emptyLabel: string }) {
  if (!groups.length) {
    return <span className="text-app-text-muted/70 inline-flex h-7 items-center text-xs">{emptyLabel}</span>
  }

  const visibleGroups = groups.slice(0, 2)
  const hiddenCount = groups.length - visibleGroups.length
  const tooltip = groups.map((group) => group.name).join(' / ')

  return (
    <Tooltip content={tooltip} side="top" disabled={groups.length <= 2}>
      <div className="flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden">
        {visibleGroups.map((group) => (
          <span
            key={group.id}
            className="border-app-border    bg-card-bg  text-app-text-muted inline-flex   max-w-28 min-w-0 shrink items-center rounded-full border  px-2 py-1 text-xs"
          >
            <span className="truncate">{group.name}</span>
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className="border-app-border    bg-card-bg  text-app-text-muted inline-flex  shrink-0 items-center rounded-full border  px-2 py-1  text-xs tabular-nums">
            +{hiddenCount}
          </span>
        ) : null}
      </div>
    </Tooltip>
  )
}

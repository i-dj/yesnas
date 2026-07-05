import { Tooltip, type DataTableHeader } from '@/components/ui'
import { formatDateTime, getTimestamp } from '@/lib/utils'
import type { Log } from '@/types'
import { CheckCircle2, CircleAlert, CircleX, UserRound } from 'lucide-react'
import type { useTranslations } from 'next-intl'

export function getLogColumns({
  t,
  timeZone,
  locale,
}: {
  t: ReturnType<typeof useTranslations>
  timeZone: string
  locale: string
}): DataTableHeader<Log>[] {
  return [
    {
      key: 'ipAddress',
      label: t('columns.ipAddress'),
      width: '160px',
      render: (_, record) => (
        <span className="text-app-text-muted">
          {record.ipType === 'private'
            ? t('values.privateNetwork')
            : record.ipType === 'local'
              ? t('values.localMachine')
              : `${record.country ?? ''}${record.city ?? ''}` || '-'}
        </span>
      ),
    },
    {
      key: 'event',
      label: t('columns.event'),
      render: (_, log) => (
        <div className="flex min-w-0 items-center gap-2">
          <SeverityIcon severity={log.severity} />
          <Tooltip content={log.content || '-'} disabled={!log.content}>
            <span className="text-app-text-muted truncate text-sm leading-none">{log.content || '-'}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'occurredAt',
      label: t('columns.time'),
      width: '180px',
      render: (_, record) => (
        <Tooltip content={formatDateTime(record.occurredAt, timeZone)}>
          <span className="text-app-text-muted" suppressHydrationWarning>
            {getTimestamp(new Date(record.occurredAt), locale, timeZone)}
          </span>
        </Tooltip>
      ),
    },
    {
      key: 'actorUsername',
      label: t('columns.actor'),
      width: '120px',
      render: (_, log) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-app-hover grid size-7 shrink-0 place-items-center rounded-full">
            <UserRound className="text-app-text-muted size-3.5" />
          </span>
          <span className="truncate">{log.actorDisplayName || log.actorUsername || t('values.system')}</span>
        </div>
      ),
    },
  ]
}

function SeverityIcon({ severity }: { severity: Log['severity'] }) {
  if (severity === 'error') return <CircleX className="size-3.5 shrink-0 text-red-400" />
  if (severity === 'warn') return <CircleAlert className="size-3.5 shrink-0 text-amber-400" />
  return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
}

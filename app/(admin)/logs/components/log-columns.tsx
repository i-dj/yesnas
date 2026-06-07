import type { DataTableHeader } from '@/components/ui'
import { StatusPill, Tooltip } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import type { Log } from '@/types'
import { CheckCircle2, CircleAlert, CircleX, UserRound } from 'lucide-react'
import type { useTranslations } from 'next-intl'

export function getLogColumns({
  t,
  timeZone,
}: {
  t: ReturnType<typeof useTranslations>
  timeZone: string
}): DataTableHeader<Log>[] {
  return [
    {
      key: 'occurredAt',
      label: t('columns.time'),
      width: '180px',
      render: (value: string) => <span className="text-app-text-muted">{formatDateTime(value, timeZone)}</span>,
    },
    {
      key: 'actorUsername',
      label: t('columns.actor'),
      width: '150px',
      render: (_, log) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-app-hover grid size-7 shrink-0 place-items-center rounded-full">
            <UserRound className="text-app-text-muted size-3.5" />
          </span>
          <span className="truncate">{log.actorDisplayName || log.actorUsername || t('values.system')}</span>
        </div>
      ),
    },
    {
      key: 'event',
      label: t('columns.event'),
      width: '34%',
      render: (_, log) => (
        <div className="min-w-0">
          <div className="text-app-text flex min-w-0 items-center gap-2 font-medium">
            <SeverityIcon severity={log.severity} />
            <span className="truncate">{log.event || log.action || '-'}</span>
          </div>
          <Tooltip content={log.message || '-'} disabled={!log.message} triggerClassName="block min-w-0">
            <p className="app-caption text-app-text-muted mt-0.5 truncate">{log.message || '-'}</p>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'source',
      label: t('columns.source'),
      width: '110px',
      render: (value: string) => <span className="text-app-text-muted">{value || '-'}</span>,
    },
    {
      key: 'ipAddress',
      label: t('columns.ipAddress'),
      width: '150px',
      render: (value: string) => <span className="text-app-text-muted">{value || '-'}</span>,
    },
    {
      key: 'success',
      label: t('columns.result'),
      width: '100px',
      render: (value: boolean) => (
        <StatusPill color={value ? 'success' : 'danger'} content={value ? t('values.success') : t('values.failed')} />
      ),
    },
  ]
}

function SeverityIcon({ severity }: { severity: Log['severity'] }) {
  if (severity === 'error') return <CircleX className="size-3.5 shrink-0 text-red-400" />
  if (severity === 'warn') return <CircleAlert className="size-3.5 shrink-0 text-amber-400" />
  return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
}

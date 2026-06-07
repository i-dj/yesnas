'use client'

import { SideDrawer, StatusPill } from '@/components/ui'
import { formatDateTime } from '@/lib/utils'
import type { Log } from '@/types'
import { useTranslations } from 'next-intl'

export function LogDetailDrawer({
  log,
  timeZone,
  onClose,
}: {
  log: Log | null
  timeZone: string
  onClose: () => void
}) {
  const t = useTranslations('Logs')
  if (!log) return null

  const details = [
    [t('detail.time'), formatDateTime(log.occurredAt, timeZone)],
    [t('detail.category'), t(`categories.${log.category}`)],
    [t('detail.severity'), t(`severities.${log.severity}`)],
    [t('detail.source'), log.source],
    [t('detail.event'), log.event],
    [t('detail.action'), log.action],
    [t('detail.actor'), log.actorDisplayName || log.actorUsername || t('values.system')],
    [t('detail.ipAddress'), log.ipAddress],
    [t('detail.request'), [log.method, log.path].filter(Boolean).join(' ')],
    [t('detail.resource'), [log.resourceType, log.resourceName || log.resourceId].filter(Boolean).join(' · ')],
    [t('detail.userAgent'), log.userAgent],
  ].filter(([, value]) => value)

  return (
    <SideDrawer open={Boolean(log)} onOpenChange={(open) => !open && onClose()} title={t('detail.title')}>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="app-section-title text-app-text">{log.event || log.action}</h3>
            <StatusPill
              color={log.success ? 'success' : 'danger'}
              content={log.success ? t('values.success') : t('values.failed')}
            />
          </div>
          <p className="app-body-text text-app-text-muted mt-2 leading-5">{log.message || '-'}</p>
        </div>

        <dl className="border-app-border/60 grid grid-cols-[7rem_minmax(0,1fr)] border-y">
          {details.map(([label, value]) => (
            <div key={String(label)} className="contents">
              <dt className="app-body-text text-app-text-muted border-app-border/40 border-b py-2.5">{label}</dt>
              <dd className="app-body-text text-app-text border-app-border/40 border-b py-2.5 font-medium break-words">
                {String(value)}
              </dd>
            </div>
          ))}
        </dl>

        {log.details && Object.keys(log.details).length ? (
          <div>
            <h3 className="app-section-title text-app-text mb-2">{t('detail.details')}</h3>
            <pre className="app-caption bg-app-surface text-app-text-muted overflow-x-auto rounded-md p-3 leading-5">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </SideDrawer>
  )
}

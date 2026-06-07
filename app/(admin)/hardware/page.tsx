'use client'

import { CircuitBoard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { EmptyState, StatusPill } from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { getSystemHardwareStreamUrl } from '@/lib/file-api'
import { formatDateTime } from '@/lib/utils'
import type { HardwareSnapshot } from '@/types'
import { HardwareDetails, HardwareSummaryCards } from './components'

export default function HardwarePage() {
  const t = useTranslations('Hardware')
  const { data: snapshot, status: streamState } = useSse<HardwareSnapshot>(getSystemHardwareStreamUrl(1), {
    events: ['hardware-status', 'hardware', 'hardware-info', 'system-hardware'],
    listenToMessage: true,
  })

  return (
    <PageWrapper className="-mx-8 gap-3 overflow-y-auto px-8 pb-8">
      <section className="flex shrink-0 flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="app-page-title text-app-text flex items-center gap-2">
            <CircuitBoard className="size-5 text-sky-400" />
            {t('title')}
            <StatusPill
              color={streamState === 'error' ? 'danger' : streamState === 'ready' ? 'success' : 'neutral'}
              content={
                streamState === 'error'
                  ? t('stream.error')
                  : streamState === 'ready'
                    ? t('stream.live')
                    : t('stream.connecting')
              }
            />
          </div>
          <p className="text-app-text-muted mt-0.5 text-xs">{t('subtitle')}</p>
        </div>
        <p className="text-app-text-muted text-xs">
          {t('lastUpdated', { value: snapshot ? formatDateTime(snapshot.checkedAt) : '--' })}
        </p>
      </section>

      <HardwareSummaryCards snapshot={snapshot} />

      {snapshot ? (
        <HardwareDetails snapshot={snapshot} />
      ) : (
        <EmptyState
          message={streamState === 'error' ? t('stream.loadError') : t('stream.loading')}
          className="grid min-h-72 place-items-center"
        />
      )}
    </PageWrapper>
  )
}

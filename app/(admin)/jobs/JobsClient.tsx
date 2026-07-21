'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { DataTable, EmptyState, Pagination, SearchInput, StatusPill, ToggleButton } from '@/components/ui'
import { jobApi } from '@/lib/api/job.api'
import { cn, formatDateTime } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { Job, JobListResponse, JobStatus, ScheduledJob } from '@/types'
import { CalendarClock, Clock3, Database } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getJobColumns, StatusTabLabel } from './components'
import { getJobIcon, type JobStatusMetaKey, JobAction } from './constants'

interface JobsClientProps {
  initialJobsResult: JobListResponse
  initialScheduledJobs: ScheduledJob[]
  timeZone: string
  now?: string
}

const toBackendStatus = (status: JobStatusMetaKey): JobStatus | 'all' => (status === 'canceled' ? 'cancelled' : status)

export function JobsClient({ initialJobsResult, initialScheduledJobs, timeZone, now }: JobsClientProps) {
  const t = useTranslations('Jobs')
  const locale = useLocale()
  const [filterStatus, setFilterStatus] = useState<JobStatusMetaKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(initialJobsResult.pagination.pageSize || 20)
  const [jobsResult, setJobsResult] = useState(initialJobsResult)
  const [scheduledJobs, setScheduledJobs] = useState(initialScheduledJobs)
  const [loading, setLoading] = useState(false)

  const { items: jobs, pagination, counts } = jobsResult

  const fetchJobs = useCallback(
    async (page: number, nextPageSize: number, status: JobStatusMetaKey, query: string) => {
      setLoading(true)
      try {
        setJobsResult(
          await jobApi.listJobs({
            page,
            pageSize: nextPageSize,
            status: toBackendStatus(status),
            q: query,
          }),
        )
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const refresh = useCallback(async () => {
    await fetchJobs(pagination.page, pageSize, filterStatus, searchQuery)
    try {
      setScheduledJobs(await jobApi.scheduledJobs())
    } catch {
      toast.error(t('messages.scheduledLoadFailed'))
    }
  }, [fetchJobs, filterStatus, pageSize, pagination.page, searchQuery, t])

  const handleJobAction = useCallback(
    async (job: Job, action: JobAction) => {
      try {
        if (action === 'pause') await jobApi.pauseJob(job.id)
        if (action === 'resume') await jobApi.resumeJob(job.id)
        if (action === 'cancel') await jobApi.cancelJob(job.id)
        if (action === 'delete') await jobApi.remove(job.id)
        toast.success(t('messages.actionCompleted'))
        await refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('messages.actionFailed'))
      }
    },
    [refresh, t],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchJobs(1, pageSize, filterStatus, searchQuery)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [fetchJobs, filterStatus, pageSize, searchQuery])

  const statusTabs = useMemo(
    () =>
      [
        ['all', counts.all],
        ['running', counts.running],
        ['paused', counts.paused],
        ['success', counts.success],
        ['failed', counts.failed],
        ['canceled', counts.cancelled],
      ].map(([value, count]) => ({
        value: value as JobStatusMetaKey,
        label: (
          <StatusTabLabel label={t(`statuses.${value}`)} count={count as number} active={filterStatus === value} />
        ),
      })),
    [counts, filterStatus, t],
  )

  const columns = useMemo(
    () => getJobColumns({ t, timeZone, locale, now, onJobAction: handleJobAction }),
    [handleJobAction, locale, now, t, timeZone],
  )

  return (
    <PageWrapper>
      <header>
        <div className="app-page-title">{t('title')}</div>
      </header>

      {scheduledJobs.length > 0 ? (
        <section className="pb-4">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {scheduledJobs.map((job) => {
              const Icon = getJobIcon(job.type)
              return (
                <article
                  key={job.id}
                  className="border-app-border/60 bg-app-surface/50 group relative min-w-0 overflow-hidden rounded-xl border p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-app-text truncate text-sm">{t(`types.${job.type}`)}</h3>
                        <StatusPill
                          color={job.enabled ? 'success' : 'neutral'}
                          content={job.enabled ? t('scheduled.enabled') : t('scheduled.disabled')}
                        />
                      </div>

                      <div className="text-app-text-muted mt-3 space-y-1 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <Database className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate" title={job.storagePoolName || t('scheduled.systemTarget')}>
                            {job.storagePoolName || t('scheduled.systemTarget')}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <Clock3 className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">
                            {job.nextRunAt ? formatDateTime(job.nextRunAt, timeZone) : t('scheduled.waiting')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="min-h-0">
        <div className="border-app-border/60 flex flex-wrap items-center gap-3 border-b pb-3">
          <div className="min-w-0 overflow-x-auto">
            <ToggleButton items={statusTabs} value={filterStatus} onChange={setFilterStatus} />
          </div>
          <SearchInput
            wrapperClassName="ml-auto w-72 max-w-full"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
          />
        </div>

        <div className={cn('transition-opacity', loading && 'pointer-events-none opacity-50')}>
          {jobs.length ? (
            <DataTable
              headers={columns}
              data={jobs}
              showHeader={false}
              variant="plain"
              className="[&_.app-body-text]:text-sm"
              tdClassName="py-2.5"
            />
          ) : (
            <EmptyState
              message={searchQuery.trim() ? t('emptySearch') : t('empty')}
              className="border-none bg-transparent py-16"
            />
          )}
        </div>

        <div className="border-app-border/60 flex justify-end border-t pt-3">
          <Pagination
            id="jobs-page-size"
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pageSize}
            loading={loading}
            pageSizeLabel={(count) => t('pagination.pageSize', { count })}
            summaryLabel={(page, totalPages) => t('pagination.summary', { page, totalPages })}
            onPageSizeChange={setPageSize}
            onPageChange={(page) => void fetchJobs(page, pageSize, filterStatus, searchQuery)}
          />
        </div>
      </section>
    </PageWrapper>
  )
}

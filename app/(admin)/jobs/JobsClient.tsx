'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, EmptyState, Input, Progress } from '@/components/ui'
import { jobApi } from '@/lib/api/job.api'
import { cn, formatDateTime, formatSmartTimeInfo } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { Job, JobListResponse, JobStatus, ScheduledJob } from '@/types'
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  History,
  Pause,
  Play,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getJobIcon, getJobStatusMeta, type JobStatusMetaKey } from './constants'

interface JobsClientProps {
  initialJobsResult: JobListResponse
  initialScheduledJobs: ScheduledJob[]
  timeZone: string
}

type JobAction = 'pause' | 'resume' | 'cancel' | 'delete'

const pageSizeOptions = [10, 20, 50, 100] as const
const toBackendStatus = (status: JobStatusMetaKey): JobStatus | 'all' => (status === 'canceled' ? 'cancelled' : status)

const statusTone: Record<JobStatusMetaKey, string> = {
  all: 'text-app-text-muted',
  running: 'text-sky-400',
  paused: 'text-amber-400',
  success: 'text-emerald-400',
  failed: 'text-red-400',
  canceled: 'text-app-text-muted',
}

export function JobsClient({ initialJobsResult, initialScheduledJobs, timeZone }: JobsClientProps) {
  const t = useTranslations('Jobs')
  const [filterStatus, setFilterStatus] = useState<JobStatusMetaKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(initialJobsResult.pagination.page || 1)
  const [pageSize, setPageSize] = useState(initialJobsResult.pagination.pageSize || 10)
  const [jobsResult, setJobsResult] = useState(initialJobsResult)
  const [scheduledJobs, setScheduledJobs] = useState(initialScheduledJobs)
  const [jobsLoading, setJobsLoading] = useState(false)

  const { items: jobs, pagination, counts } = jobsResult

  const fetchJobs = useCallback(
    async ({
      nextPage,
      nextPageSize,
      nextStatus,
      nextQuery,
    }: {
      nextPage: number
      nextPageSize: number
      nextStatus: JobStatusMetaKey
      nextQuery: string
    }) => {
      setJobsLoading(true)
      try {
        const result = await jobApi.listJobs({
          page: nextPage,
          pageSize: nextPageSize,
          status: toBackendStatus(nextStatus),
          q: nextQuery,
        })
        setJobsResult(result)
        setPage(result.pagination.page)
        setPageSize(result.pagination.pageSize)
      } catch (error) {
        toast.error(`Load jobs failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 5000)
      } finally {
        setJobsLoading(false)
      }
    },
    [],
  )

  const loadScheduledJobs = useCallback(async () => {
    try {
      setScheduledJobs(await jobApi.scheduledJobs())
    } catch (error) {
      toast.error(`Load scheduled jobs failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 5000)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchJobs({ nextPage: 1, nextPageSize: pageSize, nextStatus: filterStatus, nextQuery: searchQuery })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [fetchJobs, filterStatus, pageSize, searchQuery])

  const refreshJobs = useCallback(() => {
    void fetchJobs({ nextPage: page, nextPageSize: pageSize, nextStatus: filterStatus, nextQuery: searchQuery })
    void loadScheduledJobs()
  }, [fetchJobs, filterStatus, loadScheduledJobs, page, pageSize, searchQuery])

  const handleJobAction = useCallback(
    async (job: Job, action: JobAction) => {
      try {
        if (action === 'pause') await jobApi.pauseJob(job.id)
        if (action === 'resume') await jobApi.resumeJob(job.id)
        if (action === 'cancel') await jobApi.cancelJob(job.id)
        if (action === 'delete') await jobApi.remove(job.id)
        toast.success('Task updated')
        refreshJobs()
      } catch (error) {
        toast.error(`Task action failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 5000)
      }
    },
    [refreshJobs],
  )

  const statusItems = useMemo(
    () =>
      [
        ['all', counts.all],
        ['running', counts.running],
        ['paused', counts.paused],
        ['success', counts.success],
        ['failed', counts.failed],
        ['canceled', counts.cancelled],
      ].map(([key, count]) => ({
        key: key as JobStatusMetaKey,
        count: count as number,
        label: t(`statuses.${key}`),
      })),
    [counts, t],
  )

  return (
    <PageWrapper className="-mx-8 h-full gap-0 overflow-hidden py-0">
      <section className="border-app-border/60 flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-app-text flex items-center gap-2 text-lg font-semibold">
            <History className="size-5 text-sky-400" />
            任务中心
          </div>
          <p className="text-app-text-muted mt-0.5 text-xs">
            {pagination.total} 条执行记录 · {scheduledJobs.length} 个计划任务
          </p>
        </div>
        <div className="relative w-72 max-w-[38vw]">
          <Search className="text-app-text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder="搜索任务、消息、状态"
            className="bg-app-hover/40 h-9 border-none pl-9"
          />
        </div>
      </section>

      <section className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_18rem]">
        <aside className="border-app-border/60 hidden min-h-0 flex-col border-r lg:flex">
          <PanelHeading
            icon={CalendarClock}
            title="计划任务"
            subtitle="自动任务与下次执行时间"
            count={scheduledJobs.length}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {scheduledJobs.length === 0 ? (
              <EmptyState message="暂无计划任务" className="border-none py-12" />
            ) : (
              scheduledJobs.map((job) => (
                <ScheduledJobItem key={job.id} job={job} timeZone={timeZone} typeLabel={t(`types.${job.type}`)} />
              ))
            )}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col">
          <div className="border-app-border/60 flex shrink-0 items-center gap-1 overflow-x-auto border-b px-4 py-3">
            {statusItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setFilterStatus(item.key)
                  setPage(1)
                }}
                className={cn(
                  'relative flex h-8 shrink-0 items-center gap-2 px-3 text-xs font-medium transition-colors',
                  filterStatus === item.key ? 'text-app-text' : 'text-app-text-muted hover:text-app-text',
                )}
              >
                {item.label}
                <span className="bg-app-hover/70 rounded-full px-1.5 py-0.5 text-[10px]">{item.count}</span>
                {filterStatus === item.key ? (
                  <span className="absolute inset-x-3 bottom-[-13px] h-0.5 bg-sky-400" />
                ) : null}
              </button>
            ))}
          </div>

          <div
            className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-2 transition-opacity', jobsLoading && 'opacity-60')}
          >
            {jobs.length === 0 ? (
              <EmptyState
                message={searchQuery.trim() ? '没有匹配当前条件的任务' : t('empty')}
                className="border-none py-16"
              />
            ) : (
              jobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  timeZone={timeZone}
                  title={job.title || t(`types.${job.type}`)}
                  statusLabel={t(`statuses.${getJobStatusMeta(job.status).key}`)}
                  onAction={handleJobAction}
                />
              ))
            )}
          </div>

          <div className="border-app-border/60 flex shrink-0 items-center justify-between border-t px-4 py-2.5">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="bg-app-bg text-app-text-muted h-8 rounded-md border-none px-2 text-xs outline-none"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  每页 {option} 条
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                icon={ChevronLeft}
                disabled={pagination.page <= 1 || jobsLoading}
                onClick={() => {
                  const nextPage = Math.max(1, pagination.page - 1)
                  setPage(nextPage)
                  void fetchJobs({ nextPage, nextPageSize: pageSize, nextStatus: filterStatus, nextQuery: searchQuery })
                }}
              />
              <span className="text-app-text-muted min-w-16 text-center text-xs">
                {pagination.page} / {Math.max(1, pagination.totalPages)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                icon={ChevronRight}
                disabled={pagination.page >= pagination.totalPages || jobsLoading}
                onClick={() => {
                  const nextPage = Math.min(pagination.totalPages, pagination.page + 1)
                  setPage(nextPage)
                  void fetchJobs({ nextPage, nextPageSize: pageSize, nextStatus: filterStatus, nextQuery: searchQuery })
                }}
              />
            </div>
          </div>
        </main>

        <aside className="border-app-border/60 hidden min-h-0 flex-col border-l xl:flex">
          <PanelHeading icon={CircleDot} title="任务活动" subtitle="状态概览与最近变化" />
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <StatTile label="运行中" value={counts.running} className="text-sky-400" />
            <StatTile label="已完成" value={counts.success} className="text-emerald-400" />
            <StatTile label="已暂停" value={counts.paused} className="text-amber-400" />
            <StatTile label="需关注" value={counts.failed} className="text-red-400" />
          </div>
          <div className="border-app-border/60 border-t px-4 py-3">
            <h3 className="text-app-text text-xs font-semibold">最近活动</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {jobs.slice(0, 8).map((job) => (
              <ActivityItem key={job.id} job={job} timeZone={timeZone} title={job.title || t(`types.${job.type}`)} />
            ))}
          </div>
        </aside>
      </section>
    </PageWrapper>
  )
}

function PanelHeading({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: typeof History
  title: string
  subtitle: string
  count?: number
}) {
  return (
    <div className="flex shrink-0 items-start gap-2 px-4 py-4">
      <Icon className="mt-0.5 size-4 text-sky-400" />
      <div className="min-w-0 flex-1">
        <h2 className="text-app-text text-sm font-semibold">{title}</h2>
        <p className="text-app-text-muted mt-0.5 truncate text-[11px]">{subtitle}</p>
      </div>
      {count !== undefined ? <span className="bg-app-hover rounded-full px-2 py-0.5 text-xs">{count}</span> : null}
    </div>
  )
}

function ScheduledJobItem({ job, typeLabel, timeZone }: { job: ScheduledJob; typeLabel: string; timeZone: string }) {
  const Icon = getJobIcon(job.type)
  return (
    <div className="hover:bg-app-hover/45 group rounded-md px-2 py-3 transition-colors">
      <div className="flex items-start gap-2.5">
        <span className="bg-app-hover grid size-8 shrink-0 place-items-center rounded-md">
          <Icon className="text-app-text-muted size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-app-text truncate text-xs font-semibold">{job.storagePoolName || typeLabel}</div>
          <div className="text-app-text-muted mt-0.5 truncate text-[11px]">
            {typeLabel} · {job.schedule}
          </div>
        </div>
        <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', job.enabled ? 'bg-emerald-400' : 'bg-zinc-500')} />
      </div>
      <div className="text-app-text-muted mt-2 flex items-center justify-between gap-2 pl-10 text-[11px]">
        <span>下次执行</span>
        <span className="text-app-text truncate">
          {job.nextRunAt ? formatDateTime(job.nextRunAt, timeZone) : '等待调度'}
        </span>
      </div>
    </div>
  )
}

function JobRow({
  job,
  title,
  statusLabel,
  timeZone,
  onAction,
}: {
  job: Job
  title: string
  statusLabel: string
  timeZone: string
  onAction: (job: Job, action: JobAction) => void
}) {
  const Icon = getJobIcon(job.type)
  const statusKey = getJobStatusMeta(job.status).key
  const terminal = ['success', 'failed', 'cancelled'].includes(job.status)
  const updated = formatSmartTimeInfo(job.updatedAt || job.createdAt, timeZone)

  return (
    <article className="border-app-border/45 group grid min-w-0 grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 border-b px-2 py-3 last:border-none md:grid-cols-[minmax(0,1fr)_8rem_6rem_6rem] md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-app-hover grid size-9 shrink-0 place-items-center rounded-md">
          <Icon className="text-app-text-muted size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-app-text truncate text-sm font-semibold">{title}</h3>
          <p className="text-app-text-muted mt-0.5 truncate text-xs">
            {[job.storagePoolName, job.message].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
      </div>
      <div className="hidden min-w-0 md:block">
        <Progress value={Math.max(0, Math.min(100, job.progress || 0))} showLabel={false} className="bg-sky-400" />
        <span className="text-app-text-muted mt-1 block text-[11px]">{Math.round(job.progress || 0)}%</span>
      </div>
      <span className={cn('hidden items-center gap-1.5 text-xs font-medium md:inline-flex', statusTone[statusKey])}>
        {statusKey === 'success' ? <CheckCircle2 className="size-3.5" /> : <CircleDot className="size-3.5" />}
        {statusLabel}
      </span>
      <div className="relative flex min-w-0 items-center justify-end">
        <span className="text-app-text-muted truncate text-[11px] group-hover:opacity-0">{updated.text}</span>
        <div className="absolute right-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!terminal ? (
            <Button
              variant="ghost"
              size="sm"
              icon={job.status === 'paused' ? Play : Pause}
              onClick={() => void onAction(job, job.status === 'paused' ? 'resume' : 'pause')}
            />
          ) : null}
          {!terminal ? (
            <Button variant="ghost" size="sm" icon={XCircle} onClick={() => void onAction(job, 'cancel')} />
          ) : null}
          <Button variant="ghost" size="sm" icon={Trash2} onClick={() => void onAction(job, 'delete')} />
        </div>
      </div>
    </article>
  )
}

function StatTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="bg-app-hover/35 rounded-md px-3 py-2.5">
      <div className={cn('text-lg font-semibold', className)}>{value}</div>
      <div className="text-app-text-muted mt-0.5 text-[11px]">{label}</div>
    </div>
  )
}

function ActivityItem({ job, title, timeZone }: { job: Job; title: string; timeZone: string }) {
  const Icon = getJobIcon(job.type)
  const statusKey = getJobStatusMeta(job.status).key
  const updated = formatSmartTimeInfo(job.updatedAt || job.createdAt, timeZone)
  return (
    <div className="before:bg-app-border/60 relative flex gap-2.5 pb-5 before:absolute before:top-7 before:bottom-0 before:left-3.5 before:w-px last:before:hidden">
      <span className="bg-app-hover z-10 grid size-7 shrink-0 place-items-center rounded-full">
        <Icon className={cn('size-3', statusTone[statusKey])} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-app-text truncate text-xs font-medium">{title}</p>
        <p className="text-app-text-muted mt-0.5 line-clamp-2 text-[11px]">
          {job.message || job.storagePoolName || '-'}
        </p>
        <p className="text-app-text-muted mt-1 text-[10px]">{updated.text}</p>
      </div>
    </div>
  )
}

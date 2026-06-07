'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, DataTable, EmptyState, Input, Select } from '@/components/ui'
import { logApi } from '@/lib/api/log.api'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type {
  Log,
  LogCategory,
  LogHeatmapRange,
  LogHeatmapResponse,
  LogSeverity,
  LogsQuery,
  LogsResponse,
} from '@/types'
import { ChevronLeft, ChevronRight, Search, ScrollText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getLogColumns, LogDetailDrawer, LogHeatmap, type LogTimeRange } from './components'

type SuccessFilter = 'all' | 'true' | 'false'
type Filters = {
  q: string
  category: LogCategory | 'all'
  severity: LogSeverity | 'all'
  source: string
  event: string
  ipAddress: string
  success: SuccessFilter
  from: string
  to: string
}

const initialFilters: Filters = {
  q: '',
  category: 'all',
  severity: 'all',
  source: 'all',
  event: '',
  ipAddress: '',
  success: 'all',
  from: '',
  to: '',
}

const pageSizeOptions = [20, 50, 100, 200] as const

export function LogsClient({
  initialLogs,
  initialHeatmap,
  timeZone,
}: {
  initialLogs: LogsResponse
  initialHeatmap: LogHeatmapResponse
  timeZone: string
}) {
  const t = useTranslations('Logs')
  const [logsResult, setLogsResult] = useState(initialLogs)
  const [heatmap, setHeatmap] = useState(initialHeatmap)
  const [range, setRange] = useState<LogTimeRange>(initialHeatmap.range)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    ...getRangePeriod(initialHeatmap.range, timeZone),
  }))
  const [page, setPage] = useState(initialLogs.pagination.page)
  const [pageSize, setPageSize] = useState(initialLogs.pagination.pageSize)
  const [loading, setLoading] = useState(false)
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<string>()
  const firstLoad = useRef(true)

  const columns = useMemo(() => getLogColumns({ t, timeZone }), [t, timeZone])

  const fetchLogs = useCallback(
    async (nextPage: number, nextPageSize: number, nextFilters: Filters) => {
      setLoading(true)
      try {
        const query: LogsQuery = {
          page: nextPage,
          pageSize: nextPageSize,
          q: nextFilters.q,
          category: nextFilters.category,
          severity: nextFilters.severity,
          source: nextFilters.source,
          event: nextFilters.event,
          ipAddress: nextFilters.ipAddress,
          success: nextFilters.success === 'all' ? undefined : nextFilters.success === 'true',
          from: toRFC3339(nextFilters.from, timeZone),
          to: toRFC3339(nextFilters.to, timeZone),
        }
        const result = await logApi.list(query)
        setLogsResult(result)
        setPage(result.pagination.page)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t, timeZone],
  )

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    const timer = window.setTimeout(() => void fetchLogs(1, pageSize, filters), 300)
    return () => window.clearTimeout(timer)
  }, [fetchLogs, filters, pageSize])

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const changeRange = async (nextRange: LogTimeRange) => {
    setRange(nextRange)
    setSelectedBucket(undefined)
    if (nextRange === 'custom') return

    const period = getRangePeriod(nextRange, timeZone)
    setFilters((current) => ({ ...current, ...period }))
    setPage(1)
    setHeatmapLoading(true)
    try {
      setHeatmap(await logApi.heatmap(nextRange))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('messages.heatmapFailed'))
    } finally {
      setHeatmapLoading(false)
    }
  }

  const selectBucket = (time: string, bucket: LogHeatmapResponse['bucket']) => {
    const period = getBucketPeriod(time, bucket, timeZone)
    setSelectedBucket(time)
    setFilters((current) => ({ ...current, ...period }))
    setPage(1)
  }

  const { items, pagination } = logsResult

  return (
    <PageWrapper className="gap-4 overflow-y-auto py-5">
      <header>
        <div>
          <div className="app-page-title text-app-text flex items-center gap-2">
            <ScrollText className="size-5 text-sky-400" />
            {t('title')}
          </div>
          <p className="app-body-text text-app-text-muted mt-1">{t('subtitle')}</p>
        </div>
      </header>

      <LogHeatmap
        data={heatmap}
        range={range}
        loading={heatmapLoading}
        total={pagination.total}
        selectedBucket={selectedBucket}
        timeZone={timeZone}
        onRangeChange={changeRange}
        onBucketClick={selectBucket}
      />

      <section className="min-h-0">
        <div className="border-app-border/60 flex flex-wrap items-center justify-end gap-2 border-b pb-3">
          <div className="relative w-80 max-w-full">
            <Search className="text-app-text-muted pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2" />
            <Input
              value={filters.q}
              placeholder={t('filters.search')}
              className="h-8 bg-transparent pl-8"
              onChange={(event) => updateFilter('q', event.target.value)}
            />
          </div>
          <Select
            value={filters.category}
            wrapperClassName="w-32"
            className="h-8 bg-transparent"
            onChange={(event) => updateFilter('category', event.target.value as Filters['category'])}
          >
            <option value="all">{t('filters.allCategories')}</option>
            <option value="user">{t('categories.user')}</option>
            <option value="system">{t('categories.system')}</option>
          </Select>
          <Select
            value={filters.severity}
            wrapperClassName="w-32"
            className="h-8 bg-transparent"
            onChange={(event) => updateFilter('severity', event.target.value as Filters['severity'])}
          >
            <option value="all">{t('filters.allSeverities')}</option>
            <option value="info">{t('severities.info')}</option>
            <option value="warn">{t('severities.warn')}</option>
            <option value="error">{t('severities.error')}</option>
          </Select>
          <Select
            value={filters.success}
            wrapperClassName="w-28"
            className="h-8 bg-transparent"
            onChange={(event) => updateFilter('success', event.target.value as SuccessFilter)}
          >
            <option value="all">{t('filters.allResults')}</option>
            <option value="true">{t('values.success')}</option>
            <option value="false">{t('values.failed')}</option>
          </Select>
        </div>

        <div className={cn('transition-opacity', loading && 'pointer-events-none opacity-50')}>
          {items.length ? (
            <DataTable
              headers={columns}
              data={items}
              variant="plain"
              tdClassName="py-2.5"
              onRowClickAction={(_, log) => setSelectedLog(log)}
            />
          ) : (
            <EmptyState message={t('empty')} className="border-none bg-transparent py-16" />
          )}
        </div>

        <div className="border-app-border/60 flex items-center justify-between border-t pt-3">
          <Select
            value={pageSize}
            wrapperClassName="w-32"
            className="h-8 bg-transparent"
            onChange={(event) => {
              const nextPageSize = Number(event.target.value)
              setPageSize(nextPageSize)
              setPage(1)
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {t('pagination.pageSize', { count: option })}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              icon={ChevronLeft}
              disabled={page <= 1 || loading}
              onClick={() => {
                const nextPage = Math.max(1, page - 1)
                setPage(nextPage)
                void fetchLogs(nextPage, pageSize, filters)
              }}
            />
            <span className="app-caption text-app-text-muted min-w-20 text-center">
              {t('pagination.summary', { page, totalPages: Math.max(1, pagination.totalPages) })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={ChevronRight}
              disabled={page >= pagination.totalPages || loading}
              onClick={() => {
                const nextPage = Math.min(pagination.totalPages, page + 1)
                setPage(nextPage)
                void fetchLogs(nextPage, pageSize, filters)
              }}
            />
          </div>
        </div>
      </section>

      <LogDetailDrawer log={selectedLog} timeZone={timeZone} onClose={() => setSelectedLog(null)} />
    </PageWrapper>
  )
}

function toRFC3339(value: string, timeZone: string) {
  if (!value) return undefined
  const date = zonedWallTimeToDate(value, timeZone)
  if (Number.isNaN(date.getTime())) return undefined

  const offsetMinutes = Math.round(getTimeZoneOffset(date, timeZone) / 60_000)
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0')
  const minutes = String(absoluteOffset % 60).padStart(2, '0')
  return `${value}:00${sign}${hours}:${minutes}`
}

function getRangePeriod(range: LogHeatmapRange, timeZone: string) {
  const to = new Date()
  const from = new Date(to)
  if (range === '24h') from.setHours(from.getHours() - 24)
  if (range === '7d') from.setDate(from.getDate() - 7)
  if (range === '30d') from.setDate(from.getDate() - 30)
  if (range === '90d') from.setDate(from.getDate() - 90)
  if (range === '1y') from.setFullYear(from.getFullYear() - 1)
  return { from: toDateTimeLocalInZone(from, timeZone), to: toDateTimeLocalInZone(to, timeZone) }
}

function getBucketPeriod(time: string, bucket: LogHeatmapResponse['bucket'], timeZone: string) {
  const from = parseUtcBucketDate(time, bucket)
  const to = new Date(from)
  if (bucket === 'hour') to.setUTCHours(to.getUTCHours() + 1)
  if (bucket === 'day') to.setUTCDate(to.getUTCDate() + 1)
  if (bucket === 'month') to.setUTCMonth(to.getUTCMonth() + 1)
  return { from: toDateTimeLocalInZone(from, timeZone), to: toDateTimeLocalInZone(to, timeZone) }
}

function parseUtcBucketDate(value: string, bucket: LogHeatmapResponse['bucket']) {
  if (bucket === 'month') return new Date(`${value}-01T00:00:00Z`)
  if (bucket === 'day') return new Date(`${value}T00:00:00Z`)
  return new Date(`${value}Z`)
}

function toDateTimeLocalInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value || ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

function zonedWallTimeToDate(value: string, timeZone: string) {
  const [datePart, timePart = '00:00'] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const wallTime = Date.UTC(year, month - 1, day, hour, minute)
  let date = new Date(wallTime)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    date = new Date(wallTime - getTimeZoneOffset(date, timeZone))
  }

  return date
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value || 0)
  const zonedTime = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'))
  return zonedTime - date.getTime()
}

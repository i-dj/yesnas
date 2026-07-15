'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Checkbox, DataTable, EmptyState, Pagination, SearchInput, ToggleButton } from '@/components/ui'
import { logApi } from '@/lib/api/log.api'
import { formatDateRange, getDateBucketRange, getDateRange, getZonedDateTime } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { Log, LogHeatmapRange, LogHeatmapResponse, LogSeverity, LogsQuery, LogsResponse } from '@/types'
import { Clock3, ScrollText } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getLogColumns, LogHeatmap } from './components'
import {
  DEFAULT_RANGE,
  PAGE_SIZE_OPTIONS,
  addFailureCounts,
  parsePage,
  parsePageSize,
  parseRange,
  parseSeverity,
  parseSuccess,
} from './utils'

type ResultFilter = 'success' | 'failed'
type Filters = {
  q: string
  severity: LogSeverity | 'all'
  results: ResultFilter[]
  from: string
  to: string
}

const INITIAL_FILTERS: Filters = {
  q: '',
  severity: 'all',
  results: ['success', 'failed'],
  from: '',
  to: '',
}

const severityOptions: ReadonlyArray<Filters['severity']> = ['all', 'info', 'warn', 'error']

export function LogsClient({
  initialLogs,
  initialHeatmap,
  initialFailedLogs,
  initialPeriod,
  initialQuery,
  timeZone,
  now,
}: {
  initialLogs: LogsResponse
  initialHeatmap: LogHeatmapResponse
  initialFailedLogs: Log[]
  initialPeriod: { from: string; to: string }
  initialQuery: { q: string; severity: Filters['severity']; success: boolean | undefined }
  timeZone: string
  now?: string
}) {
  const t = useTranslations('Logs')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()
  const [logsResult, setLogsResult] = useState(initialLogs)
  const [heatmap, setHeatmap] = useState(() => addFailureCounts(initialHeatmap, initialFailedLogs))
  const initialRangePeriod = useMemo(
    () => ({
      from: getZonedDateTime(initialPeriod.from, timeZone)?.local ?? '',
      to: getZonedDateTime(initialPeriod.to, timeZone)?.local ?? '',
    }),
    [initialPeriod.from, initialPeriod.to, timeZone],
  )
  const [filters, setFilters] = useState<Filters>(() => ({
    ...INITIAL_FILTERS,
    q: initialQuery.q,
    severity: initialQuery.severity,
    results: successToResults(initialQuery.success),
    ...initialRangePeriod,
  }))
  const [loading, setLoading] = useState(false)
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const lastSearchKey = useRef(searchKey)
  const currentRange = useRef<LogHeatmapRange>(initialHeatmap.range)
  const currentPeriod = useRef(initialRangePeriod)
  const filterBarRef = useRef<HTMLDivElement>(null)
  const scrollAfterPageLoad = useRef(false)

  const columns = useMemo(() => getLogColumns({ t, timeZone, locale, now }), [locale, now, t, timeZone])
  const range = parseRange(searchParams.get('range'))
  const selectedBucket = searchParams.get('bucket') ?? undefined
  const rangePeriod = useMemo(
    () => (range === initialHeatmap.range ? initialRangePeriod : getDateRange(range, timeZone)),
    [initialHeatmap.range, initialRangePeriod, range, timeZone],
  )
  const activePeriod = useMemo(
    () => formatDateRange(filters.from, filters.to, locale, timeZone),
    [filters.from, filters.to, locale, timeZone],
  )
  const heatmapTotal = useMemo(
    () => heatmap.buckets.reduce((total, bucket) => total + bucket.count, 0),
    [heatmap.buckets],
  )
  const heatmapRangeEnd = useMemo(
    () => getZonedDateTime(rangePeriod.to, timeZone)?.iso ?? '',
    [rangePeriod.to, timeZone],
  )

  const fetchLogs = useCallback(
    async (nextPage: number, nextPageSize: number, nextFilters: Filters) => {
      setLoading(true)
      try {
        const query: LogsQuery = {
          page: nextPage,
          pageSize: nextPageSize,
          q: nextFilters.q,
          severity: nextFilters.severity,
          success: nextFilters.results.length === 1 ? nextFilters.results[0] === 'success' : undefined,
          from: getZonedDateTime(nextFilters.from, timeZone)?.iso,
          to: getZonedDateTime(nextFilters.to, timeZone)?.iso,
        }
        const result = await logApi.list(query)
        setLogsResult(result)
        if (scrollAfterPageLoad.current) {
          scrollAfterPageLoad.current = false
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            })
          })
        }
      } catch (error) {
        scrollAfterPageLoad.current = false
        toast.error(error instanceof Error ? error.message : t('messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t, timeZone],
  )

  const fetchHeatmap = useCallback(
    async (nextRange: LogHeatmapRange, period: Pick<Filters, 'from' | 'to'>) => {
      setHeatmapLoading(true)
      try {
        const queryPeriod = {
          from: getZonedDateTime(period.from, timeZone)?.iso,
          to: getZonedDateTime(period.to, timeZone)?.iso,
        }
        const [nextHeatmap, failedLogs] = await Promise.all([
          logApi.heatmap(nextRange),
          logApi.list({ page: 1, pageSize: 200, success: false, ...queryPeriod }),
        ])
        setHeatmap(addFailureCounts(nextHeatmap, failedLogs.items))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('messages.heatmapFailed'))
      } finally {
        setHeatmapLoading(false)
      }
    },
    [t, timeZone],
  )

  useEffect(() => {
    if (lastSearchKey.current === searchKey) return
    lastSearchKey.current = searchKey

    const nextRange = parseRange(searchParams.get('range'))
    const nextPage = parsePage(searchParams.get('page'))
    const nextPageSize = parsePageSize(searchParams.get('pageSize'))
    const rangeChanged = currentRange.current !== nextRange
    const nextPeriod = rangeChanged ? getDateRange(nextRange, timeZone) : currentPeriod.current
    const from = getZonedDateTime(searchParams.get('from'), timeZone)?.local ?? nextPeriod.from
    const to = getZonedDateTime(searchParams.get('to'), timeZone)?.local ?? nextPeriod.to
    const nextFilters: Filters = {
      ...INITIAL_FILTERS,
      q: searchParams.get('q') ?? '',
      severity: parseSeverity(searchParams.get('severity')),
      results: successToResults(parseSuccess(searchParams.get('success'))),
      from,
      to,
    }

    currentPeriod.current = { from, to }
    setFilters(nextFilters)
    void fetchLogs(nextPage, nextPageSize, nextFilters)

    if (rangeChanged) {
      currentRange.current = nextRange
      void fetchHeatmap(nextRange, nextPeriod)
    }
  }, [fetchHeatmap, fetchLogs, searchKey, searchParams, timeZone])

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
    updateUrl({ [key]: value === 'all' ? null : String(value), page: null })
  }

  const updateResults = (results: ResultFilter[]) => {
    if (results.length === 0) return
    setFilters((current) => ({ ...current, results }))
    updateUrl({
      success: results.length === 1 ? String(results[0] === 'success') : null,
      page: null,
    })
  }

  const changeRange = (nextRange: LogHeatmapRange) => {
    updateUrl({
      range: nextRange === DEFAULT_RANGE ? null : nextRange,
      from: null,
      to: null,
      bucket: null,
      page: null,
    })
  }

  const changePage = (nextPage: number) => {
    scrollAfterPageLoad.current = true
    updateUrl({ page: nextPage <= 1 ? null : String(nextPage) })
  }

  const selectBucket = (time: string, bucket: LogHeatmapResponse['bucket']) => {
    const period = getDateBucketRange(time, bucket)
    updateUrl({ from: period.from, to: period.to, bucket: time, page: null })
  }

  const updateUrl = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false })
  }

  const { items, pagination } = logsResult
  const { page, pageSize } = pagination

  return (
    <PageWrapper>
      <header>
        <div className="app-page-title text-app-text flex items-center gap-2">{t('title')}</div>
        <p className="text-app-text-muted mt-1 text-sm">{t('subtitle')}</p>
      </header>

      <LogHeatmap
        data={heatmap}
        range={range}
        loading={heatmapLoading}
        total={heatmapTotal}
        selectedBucket={selectedBucket}
        rangeEnd={heatmapRangeEnd}
        timeZone={timeZone}
        onRangeChangeAction={changeRange}
        onBucketClickAction={selectBucket}
      />

      <section className="min-h-0">
        <div
          ref={filterBarRef}
          className="border-app-border/60 flex scroll-mt-3 flex-wrap items-center gap-2 border-b pb-3"
        >
          <ToggleButton
            items={severityOptions.map((value) => ({
              value,
              label: value === 'all' ? t('filters.allSeverities') : t(`severities.${value}`),
            }))}
            value={filters.severity}
            shape="pill"
            onChange={(value) => updateFilter('severity', value)}
          />
          <div className="flex h-8 items-center rounded-lg">
            <Checkbox
              label={t('values.success')}
              checked={filters.results.includes('success')}
              onChange={() => toggleResult(filters.results, 'success', updateResults)}
            />
            <Checkbox
              label={t('values.failed')}
              checked={filters.results.includes('failed')}
              onChange={() => toggleResult(filters.results, 'failed', updateResults)}
            />
          </div>
          <div
            className="border-app-border bg-app-surface/70 text-app-text-muted flex h-8 min-w-0 items-center gap-2 rounded-lg border px-2.5 text-sm shadow-sm"
            title={activePeriod}
          >
            <span className="bg-app-hover grid size-5 shrink-0 place-items-center rounded-md">
              <Clock3 className="size-3.5" />
            </span>
            <span className="truncate">{activePeriod}</span>
          </div>
          <SearchInput
            wrapperClassName="ml-auto w-80 max-w-full"
            value={filters.q}
            placeholder={t('filters.search')}
            onChange={(event) => updateFilter('q', event.target.value)}
          />
        </div>

        <div className={cn('transition-opacity', loading && 'pointer-events-none opacity-50')}>
          {items.length ? (
            <DataTable
              headers={columns}
              data={items}
              showHeader={false}
              variant="plain"
              className="[&_.app-body-text]:text-sm"
            />
          ) : (
            <EmptyState message={t('empty')} className="border-none bg-transparent py-16" />
          )}
        </div>

        <div className="border-app-border/60 flex items-center justify-end border-t pt-3">
          <Pagination
            id="logs-page-size"
            page={page}
            totalPages={pagination.totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            loading={loading}
            pageSizeLabel={(count) => t('pagination.pageSize', { count })}
            summaryLabel={(currentPage, totalPages) => t('pagination.summary', { page: currentPage, totalPages })}
            onPageChange={changePage}
            onPageSizeChange={(nextPageSize) =>
              updateUrl({ pageSize: nextPageSize === 20 ? null : String(nextPageSize), page: null })
            }
          />
        </div>
      </section>
    </PageWrapper>
  )
}

function toggleResult(current: ResultFilter[], result: ResultFilter, onChange: (value: ResultFilter[]) => void) {
  const next = current.includes(result) ? current.filter((item) => item !== result) : [...current, result]
  if (next.length > 0) onChange(next)
}

function successToResults(value: boolean | undefined): ResultFilter[] {
  if (value === true) return ['success']
  if (value === false) return ['failed']
  return ['success', 'failed']
}

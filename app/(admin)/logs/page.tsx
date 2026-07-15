import { logApi } from '@/lib/api/log.api'
import { getDateRange, getZonedDateTime } from '@/lib/date-utils'
import { getRequestTimeZone } from '@/lib/server/request-context'

import { LogsClient } from './LogsClient'
import { parsePage, parsePageSize, parseRange, parseSeverity, parseSuccess } from './utils'

export const dynamic = 'force-dynamic'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const getParam = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value ?? null
  }
  const now = new Date().toISOString()
  const timeZone = await getRequestTimeZone()
  const range = parseRange(getParam('range'))
  const initialRange = getDateRange(range, timeZone)
  const period = {
    from: getZonedDateTime(getParam('from'), timeZone)?.iso ?? getZonedDateTime(initialRange.from, timeZone)!.iso,
    to: getZonedDateTime(getParam('to'), timeZone)?.iso ?? getZonedDateTime(initialRange.to, timeZone)!.iso,
  }
  const page = parsePage(getParam('page'))
  const pageSize = parsePageSize(getParam('pageSize'))
  const q = getParam('q') ?? ''
  const severity = parseSeverity(getParam('severity'))
  const success = parseSuccess(getParam('success'))
  const [logs, heatmap, failedLogs] = await Promise.all([
    logApi.list({ page, pageSize, q, severity, success, ...period }),
    logApi.heatmap(range),
    logApi.list({ page: 1, pageSize: 200, success: false, ...period }),
  ])

  return (
    <LogsClient
      initialLogs={logs}
      initialHeatmap={heatmap}
      initialFailedLogs={failedLogs.items}
      initialPeriod={period}
      initialQuery={{ q, severity, success }}
      timeZone={timeZone}
      now={now}
    />
  )
}

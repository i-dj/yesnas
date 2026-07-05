import { logApi } from '@/lib/api/log.api'
import { getDateRange, getZonedDateTime } from '@/lib/date-utils'
import { getServerTimeZone } from '@/lib/server/file-service'

import { LogsClient } from './LogsClient'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const timeZone = getServerTimeZone()
  const initialRange = getDateRange('90d', timeZone)
  const period = {
    from: getZonedDateTime(initialRange.from, timeZone)!.rfc3339,
    to: getZonedDateTime(initialRange.to, timeZone)!.rfc3339,
  }
  const [logs, heatmap, failedLogs] = await Promise.all([
    logApi.list({ page: 1, pageSize: 20, ...period }),
    logApi.heatmap('90d'),
    logApi.list({ page: 1, pageSize: 200, success: false, ...period }),
  ])

  return (
    <LogsClient
      initialLogs={logs}
      initialHeatmap={heatmap}
      initialFailedLogs={failedLogs.items}
      initialPeriod={period}
      timeZone={timeZone}
    />
  )
}

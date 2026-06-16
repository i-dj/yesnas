import { logApi } from '@/lib/api/log.api'
import { getServerTimeZone } from '@/lib/server/file-service'

import { LogsClient } from './LogsClient'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const to = new Date()
  const from = new Date(to)
  from.setHours(from.getHours() - 24)
  const period = { from: from.toISOString(), to: to.toISOString() }
  const [logs, heatmap, failedLogs] = await Promise.all([
    logApi.list({ page: 1, pageSize: 20, ...period }),
    logApi.heatmap('24h'),
    logApi.list({ page: 1, pageSize: 200, success: false, ...period }),
  ])

  return (
    <LogsClient
      initialLogs={logs}
      initialHeatmap={heatmap}
      initialFailedLogs={failedLogs.items}
      initialPeriod={period}
      timeZone={getServerTimeZone()}
    />
  )
}

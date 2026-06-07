import { logApi } from '@/lib/api/log.api'
import { getServerTimeZone } from '@/lib/server/file-service'

import { LogsClient } from './LogsClient'

export default async function LogsPage() {
  const to = new Date()
  const from = new Date(to)
  from.setHours(from.getHours() - 24)
  const [logs, heatmap] = await Promise.all([
    logApi.list({ page: 1, pageSize: 20, from: from.toISOString(), to: to.toISOString() }),
    logApi.heatmap('24h'),
  ])

  return <LogsClient initialLogs={logs} initialHeatmap={heatmap} timeZone={getServerTimeZone()} />
}

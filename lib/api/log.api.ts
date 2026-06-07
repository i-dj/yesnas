import type { Log, LogHeatmapBucket, LogHeatmapRange, LogHeatmapResponse, LogsQuery, LogsResponse } from '@/types'
import { request } from './request'

type RawLogsResponse = Omit<LogsResponse, 'items'> & { items: Log[] | null }
type RawLogHeatmapResponse = Omit<LogHeatmapResponse, 'buckets'> & { buckets: LogHeatmapBucket[] | null }

const toQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === 'all') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const logApi = {
  list: async (params: LogsQuery = {}) => {
    const response = await request<RawLogsResponse>(
      `/logs${toQueryString({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        q: params.q?.trim(),
        category: params.category,
        severity: params.severity,
        source: params.source,
        event: params.event?.trim(),
        actorUserId: params.actorUserId?.trim(),
        ipAddress: params.ipAddress?.trim(),
        success: params.success,
        from: params.from,
        to: params.to,
      })}`,
      { unwrapList: false },
    )

    return {
      ...response,
      items: Array.isArray(response.items) ? response.items : [],
      pagination: response.pagination ?? {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        total: 0,
        totalPages: 0,
      },
    }
  },

  heatmap: async (range: LogHeatmapRange = '24h') => {
    const response = await request<RawLogHeatmapResponse>(`/logs/heatmap${toQueryString({ range })}`, {
      unwrapList: false,
    })
    return { ...response, buckets: Array.isArray(response.buckets) ? response.buckets : [] }
  },
}

export type LogCategory = 'user' | 'system'
export type LogSeverity = 'info' | 'warn' | 'error'
export type LogSource = 'api' | 'system' | string
export type EventType = string

export interface LogDetails {
  [key: string]: unknown
}

export interface Log {
  id: string
  category: LogCategory
  severity: LogSeverity
  source: LogSource
  event: EventType
  action: string
  success: boolean

  actorUserId: string
  actorUsername: string
  actorDisplayName: string

  ipAddress: string
  userAgent: string
  method: string
  path: string

  resourceType: string
  resourceId: string
  resourceName: string

  message: string
  details?: LogDetails | null

  occurredAt: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface LogsResponse {
  items: Log[]
  pagination: Pagination
}

export type LogHeatmapRange = '24h' | '7d' | '30d' | '90d' | '1y'
export type LogHeatmapBucketType = 'hour' | 'day' | 'month'

export interface LogHeatmapBucket {
  time: string
  count: number
}

export interface LogHeatmapResponse {
  range: LogHeatmapRange
  bucket: LogHeatmapBucketType
  buckets: LogHeatmapBucket[]
}

export interface LogsQuery {
  page?: number
  pageSize?: number
  q?: string

  category?: LogCategory | 'all'
  severity?: LogSeverity | 'all'
  source?: LogSource | 'all'
  event?: string

  actorUserId?: string
  ipAddress?: string
  success?: boolean

  from?: string
  to?: string
}

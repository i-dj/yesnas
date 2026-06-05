export type JobStatus = 'pending' | 'running' | 'paused' | 'success' | 'failed' | 'cancelled'
export type JobType = 'cloud_sync' | 'data_transfer' | 'back_to_cloud' | 'auto_snapshot'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  title?: string
  storagePoolId?: string
  storagePoolName?: string
  resourceType?: string
  resourceId?: string
  progress: number
  message?: string
  errorMessage?: string
  schedule?: string
  scheduleLabel?: string
  cron?: string
  nextRunAt?: string
  nextExecutionAt?: string
  nextScheduledAt?: string
  scheduledAt?: string
  runAt?: string
  executeAt?: string
  createdAt?: string
  updatedAt?: string
  startedAt?: string
  finishedAt?: string
}

export interface ScheduledJob {
  id: string
  type: JobType
  action?: string
  status: 'scheduled' | 'disabled' | string
  enabled: boolean
  schedule: string
  nextRunAt?: string
  lastRunAt?: string
  storagePoolID?: string
  storagePoolName?: string
  resourceType?: string
  resourceID?: string
}

export interface JobPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface JobCounts {
  all: number
  pending: number
  running: number
  paused: number
  success: number
  failed: number
  cancelled: number
}

export interface JobListResponse {
  items: Job[]
  pagination: JobPagination
  counts: JobCounts
}

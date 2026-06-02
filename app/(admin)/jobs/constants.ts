import type { JobStatus, JobType } from '@/types'
import { ArrowRightLeft, Cloud, CloudUpload, Joystick, type LucideIcon } from 'lucide-react'

export type JobStatusFilter = 'all' | 'running' | 'paused' | 'success' | 'failed' | 'canceled'

interface JobStatusMeta {
  statuses: readonly JobStatus[] | null
  color: string
}

export const JOB_STATUS_META = {
  all: {
    statuses: null,
    color: 'gray',
  },
  running: {
    statuses: ['running', 'pending'],
    color: 'blue',
  },
  paused: {
    statuses: ['paused'],
    color: 'gray',
  },
  success: {
    statuses: ['success'],
    color: 'green',
  },
  failed: {
    statuses: ['failed'],
    color: 'red',
  },
  canceled: {
    statuses: ['cancelled'],
    color: 'gray',
  },
} as const satisfies Record<JobStatusFilter, JobStatusMeta>

export type JobStatusMetaKey = keyof typeof JOB_STATUS_META

export const getJobStatusMeta = (status: JobStatus) => {
  const key =
    (Object.entries(JOB_STATUS_META).find(([, meta]) => {
      const statuses = meta.statuses as readonly JobStatus[] | null
      return statuses?.includes(status)
    })?.[0] as JobStatusFilter | undefined) ?? 'failed'

  return { key, ...JOB_STATUS_META[key] }
}

const jobTypeIcons = {
  cloud_sync: Cloud,
  data_transfer: ArrowRightLeft,
  back_to_cloud: CloudUpload,
} satisfies Record<JobType, LucideIcon>

export const getJobIcon = (type: JobType) => jobTypeIcons[type] ?? Joystick

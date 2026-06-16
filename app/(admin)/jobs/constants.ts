import type { JobStatus, JobType, TaskStatus } from '@/types'
import { ArrowRightLeft, Camera, Cloud, CloudUpload, Joystick, type LucideIcon } from 'lucide-react'


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
} as const satisfies Record<TaskStatus, JobStatusMeta>

export type JobStatusMetaKey = keyof typeof JOB_STATUS_META

export const getJobStatusMeta = (status: JobStatus) => {
  const key =
    (Object.entries(JOB_STATUS_META).find(([, meta]) => {
      const statuses = meta.statuses as readonly JobStatus[] | null
      return statuses?.includes(status)
    })?.[0] as TaskStatus | undefined) ?? 'failed'

  return { key, ...JOB_STATUS_META[key] }
}

const jobTypeIcons = {
  cloud_sync: Cloud,
  data_transfer: ArrowRightLeft,
  back_to_cloud: CloudUpload,
  auto_snapshot: Camera,
} satisfies Record<JobType, LucideIcon>

export const getJobIcon = (type: JobType) => jobTypeIcons[type] ?? Joystick

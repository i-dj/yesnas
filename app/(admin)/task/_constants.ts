import {
  AlertCircle,
  CheckCircle2,
  List,
  MinusCircle,
  PlayCircle,
} from 'lucide-react'

import { TASK_STATUSES, TaskStatus } from '@/types/models/_constants'

export const TASK_STATUS_META = {
  all: {
    icon: List,
    dbStatuses: null,
    color: 'gray',
  },
  running: {
    icon: PlayCircle,
    dbStatuses: [TASK_STATUSES.RUNNING],
    color: 'blue',
  },
  success: {
    icon: CheckCircle2,
    dbStatuses: [TASK_STATUSES.SUCCESS],
    color: 'green',
  },
  failed: {
    icon: AlertCircle,
    dbStatuses: [TASK_STATUSES.FAILED],
    color: 'red',
  },
  canceled: {
    icon: MinusCircle,
    dbStatuses: [TASK_STATUSES.CANCELED],
    color: 'gray',
  },
} as const
export type TaskStatusMetaKey = keyof typeof TASK_STATUS_META

export const STATUS_MAP = Object.entries(TASK_STATUS_META).reduce(
  (acc, [key, meta]) => {
    if (meta.dbStatuses) {
      meta.dbStatuses.forEach((status) => {
        acc[status as TaskStatus] = key as Exclude<TaskStatusMetaKey, 'all'>
      })
    }
    return acc
  },
  {} as Record<TaskStatus, Exclude<TaskStatusMetaKey, 'all'>>,
)

export const getTaskStatusMeta = (status: TaskStatus) => {
  const uiKey = STATUS_MAP[status]
  const key = uiKey || 'failed'

  return { key, ...TASK_STATUS_META[key] }
}

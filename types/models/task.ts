export type TaskStatus = 'all' | 'running' | 'paused' | 'success' | 'failed' | 'canceled'

export interface Task {
  id: number
  name: string
  size: string
  progress: number
  status: TaskStatus
  updatedAt: string
}

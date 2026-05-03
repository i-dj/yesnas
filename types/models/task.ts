import { TaskStatus } from './_constants'

export interface Task {
  id: number
  name: string
  size: string
  progress: number
  status: TaskStatus
  updatedAt: string
}

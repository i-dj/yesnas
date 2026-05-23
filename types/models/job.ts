export type JobStatus = 'pending' | 'running' | 'paused' | 'success' | 'failed' | 'cancelled'
export type JobType = 'cloud_sync' | 'data_transfer' | 'back_to_cloud'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  storagePoolId: string
  progress: number
  message?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
}

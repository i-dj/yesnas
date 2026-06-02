import { createCrudApi } from './crud'
import { Job } from '@/types'

export const jobApi = {
  ...createCrudApi<Job>('/jobs'),
}

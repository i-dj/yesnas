import { createCrudApi } from './crud'
import { Job } from '@/types'
import { request } from './request'

export const jobApi = {
  ...createCrudApi<Job>('/jobs'),

  pauseJob: (jobId: string) =>
    request(`/jobs/${jobId}/pause`, {
      method: 'POST',
    }),

  resumeJob: (jobId: string) =>
    request(`/jobs/${jobId}/resume`, {
      method: 'POST',
    }),

  cancelJob: (jobId: string) =>
    request(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    }),
}

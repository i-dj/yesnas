import { createCrudApi } from './crud'
import type { Job, JobListResponse, JobStatus, ScheduledJob } from '@/types'
import { request } from './request'

export interface ListJobsParams {
  page?: number
  pageSize?: number
  status?: JobStatus | 'all'
  q?: string
}

const toQueryString = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const jobApi = {
  ...createCrudApi<Job>('/jobs'),

  listJobs: (params: ListJobsParams = {}) =>
    request<JobListResponse>(
      `/jobs${toQueryString({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        status: params.status ?? 'all',
        q: params.q?.trim(),
      })}`,
      { unwrapList: false },
    ),

  scheduledJobs: () => request<ScheduledJob[]>('/jobs/scheduled', { unwrapList: true }),

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

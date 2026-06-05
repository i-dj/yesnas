import { getServerTimeZone } from '@/lib/server/file-service'
import { JobsClient } from './JobsClient'
import { jobApi } from '@/lib/api/job.api'

export default async function JobsPage() {
  const [jobsResult, scheduledJobs] = await Promise.all([
    jobApi.listJobs({ page: 1, pageSize: 10, status: 'all' }),
    jobApi.scheduledJobs(),
  ])
  const timeZone = getServerTimeZone()

  return <JobsClient initialJobsResult={jobsResult} initialScheduledJobs={scheduledJobs} timeZone={timeZone} />
}

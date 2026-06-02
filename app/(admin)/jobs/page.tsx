import { getServerTimeZone } from '@/lib/server/file-service'
import { JobsClient } from './JobsClient'
import { jobApi } from '@/lib/api/job.api'

export default async function JobsPage() {
  const jobs = await jobApi.list()
  const timeZone = getServerTimeZone()

  return <JobsClient jobs={jobs} timeZone={timeZone} />
}

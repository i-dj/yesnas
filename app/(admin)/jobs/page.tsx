import { getJobs, getServerTimeZone } from '@/lib/server/file-service'
import { JobsClient } from './JobsClient'

export default async function JobsPage() {
  const jobs = await getJobs().catch(() => [])
  const timeZone = getServerTimeZone()

  return <JobsClient jobs={jobs} timeZone={timeZone} />
}

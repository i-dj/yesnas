'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { DataTable, EmptyState, ToggleButton } from '@/components/ui'
import { cancelJob, deleteJob, pauseJob, resumeJob } from '@/lib/server/file-service'
import { toast } from '@/store/use-toast-store'
import type { Job, JobStatus } from '@/types'
import { useSelections } from 'ahooks'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { StatusTabLabel } from './_components'
import { JOB_STATUS_META, type JobStatusMetaKey } from './_job-constants'
import { getJobColumns } from './_job-columns'

interface JobsClientProps {
  jobs: Job[]
  timeZone: string
}

const getStatusKey = (status: JobStatus) => {
  return Object.entries(JOB_STATUS_META).find(([, meta]) => {
    const statuses = meta.statuses as readonly JobStatus[] | null
    return statuses?.includes(status)
  })?.[0] as Exclude<JobStatusMetaKey, 'all'> | undefined
}

export function JobsClient({ jobs, timeZone }: JobsClientProps) {
  const t = useTranslations('Jobs')
  const router = useRouter()
  const [jobList, setJobList] = useState(jobs)
  const [filterStatus, setFilterStatus] = useState<JobStatusMetaKey>('all')

  useEffect(() => {
    setJobList(jobs)
  }, [jobs])

  const statusCounts = useMemo(() => {
    const counts: Record<JobStatusMetaKey, number> = {
      all: jobList.length,
      running: 0,
      paused: 0,
      success: 0,
      failed: 0,
      canceled: 0,
    }

    jobList.forEach((job) => {
      const key = getStatusKey(job.status)
      if (key) counts[key]++
    })

    return counts
  }, [jobList])

  const finalData = useMemo(() => {
    const statuses = JOB_STATUS_META[filterStatus].statuses as readonly JobStatus[] | null

    return statuses ? jobList.filter((job) => statuses.includes(job.status)) : jobList
  }, [jobList, filterStatus])

  const selections = useSelections(finalData, { itemKey: 'id' })
  const selectedIds = useMemo(() => new Set(selections.selected.map((job) => job.id)), [selections.selected])

  const statusItems = useMemo(
    () =>
      Object.entries(JOB_STATUS_META).map(([key]) => ({
        value: key,
        label: <StatusTabLabel label={t(`statuses.${key}`)} count={statusCounts[key as JobStatusMetaKey]} />,
      })),
    [statusCounts, t],
  )

  const refreshJobs = useCallback(() => {
    router.refresh()
  }, [router])

  const handleJobAction = useCallback(
    async (job: Job, action: 'pause' | 'resume' | 'cancel' | 'delete') => {
      try {
        if (action === 'pause') await pauseJob(job.id)
        if (action === 'resume') await resumeJob(job.id)
        if (action === 'cancel') await cancelJob(job.id)
        if (action === 'delete') {
          await deleteJob(job.id)
          setJobList((prev) => prev.filter((item) => item.id !== job.id))
        }
        toast.success('Task updated')
        refreshJobs()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Task action failed'
        toast.error('Task action failed', message, 5000)
      }
    },
    [refreshJobs],
  )

  const columns = useMemo(
    () => getJobColumns(selections, (key, values) => t(key, values), timeZone, handleJobAction),
    [selections, t, timeZone, handleJobAction],
  )

  return (
    <PageWrapper className="flex flex-col gap-5">
      <div>
        <ToggleButton
          className="rounded-none"
          itemClassName="text-sm"
          variant="segmented"
          items={statusItems}
          showSeparator={false}
          value={filterStatus}
          onChange={(value) => {
            if (!value) return
            setFilterStatus(value as JobStatusMetaKey)
            selections.unSelectAll()
          }}
        />

        <DataTable
          showHeader={false}
          headers={columns}
          data={finalData}
          selectedIds={selectedIds}
          onRowClickAction={(_, row) => selections.toggle(row)}
          variant="primary"
        />

        {finalData.length === 0 ? <EmptyState message={t('empty')} className="mt-2" /> : null}
      </div>
    </PageWrapper>
  )
}

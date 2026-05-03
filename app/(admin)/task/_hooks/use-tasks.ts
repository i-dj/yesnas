import { useCallback, useMemo, useState } from 'react'
import { performSort } from '@/lib/utils'
import { SORT_DIRECTIONS, SortConfig, Task } from '@/types'
import { STATUS_MAP, TASK_STATUS_META, TaskStatusMetaKey } from '../_constants'
import { useSort } from '@/hooks/use-sort'

export const useTasks = (tasks: Task[], filterStatus: TaskStatusMetaKey) => {
  const { sort, handleSort, setSort } = useSort<Task>(
    'updatedAt',
    SORT_DIRECTIONS.DESC,
  )

  const statusCounts = useMemo(() => {
    const counts = {
      all: tasks.length,
      running: 0,
      success: 0,
      failed: 0,
      canceled: 0,
    }
    tasks.forEach((t) => {
      const uiKey = STATUS_MAP[t.status]
      if (uiKey) counts[uiKey as keyof typeof counts]++
    })
    return counts
  }, [tasks])

  const finalData = useMemo(() => {
    const activeMeta = TASK_STATUS_META[filterStatus]
    const filtered = activeMeta.dbStatuses
      ? tasks.filter((t) => (activeMeta.dbStatuses as any).includes(t.status))
      : tasks
    return sort.dir ? performSort(filtered, sort.key, sort.dir) : filtered
  }, [tasks, filterStatus, sort])

  return useMemo(
    () => ({
      finalData,
      statusCounts,
      sort,
      setSort,
      handleSort,
    }),
    [finalData, statusCounts, sort, setSort, handleSort],
  )
}

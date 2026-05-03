'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, ToggleButton } from '@/components/ui'
import { MOCK_TASKS } from '@/lib/MOCK-DATA'
import { Text } from '@radix-ui/themes'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { StatusTabLabel } from './_components'
import { TASK_STATUS_META, TaskStatusMetaKey } from './_constants'
import { getTaskColumns } from './_columns'
import { useSelections } from 'ahooks'
import { useTasks } from './_hooks/use-tasks'
import { Task } from '@/types'

export default function TaskPage() {
  const t = useTranslations('Task')
  const [filterStatus, setFilterStatus] = useState<TaskStatusMetaKey>('running')
  const tasks = useMemo(
    () =>
      MOCK_TASKS.map((task) => ({
        ...task,
        name: t(`mockTasks.${task.id}.name`),
        size: t(`mockTasks.${task.id}.size`),
      })),
    [t],
  )

  const { finalData, statusCounts, sort, handleSort } = useTasks(
    tasks,
    filterStatus,
  )
  const selections = useSelections(finalData, { itemKey: 'id' })
  const statusItems = useMemo(
    () =>
      Object.entries(TASK_STATUS_META).map(([key, meta]) => ({
        value: key,

        label: (
          <StatusTabLabel
            label={t(`statuses.${key}`)}
            count={statusCounts[key as TaskStatusMetaKey]}
          />
        ),
      })),
    [statusCounts, t],
  )

  const columns = useMemo(
    () => getTaskColumns(selections, (key, values) => t(key, values)),
    [selections, t],
  )

  const handleDelete = async () => {
    console.log('delete tasks:', selections.selected)
    selections.unSelectAll()
  }

  return (
    <PageWrapper className="flex flex-col gap-5">
      <div className="border-app-border mt-3 mb-2 flex flex-row items-center justify-between border-b">
        <ToggleButton
          className="-mb-px rounded-none border-0"
          itemClassName="text-base"
          variant="segmented"
          items={statusItems}
          showSeparator={false}
          value={filterStatus}
          onChange={(v) => {
            if (v) {
              setFilterStatus(v as TaskStatusMetaKey)
              selections.unSelectAll()
            }
          }}
        />

        <ConfirmModal
          title={t('deleteTitle', { count: selections.selected.length })}
          description={t('deleteDescription')}
          onConfirm={handleDelete}
          confirmText={t('deleteConfirm')}
          trigger={
            <Button
              isDelete
              className="rounded-full"
              variant="ghost"
              tip={t('deleteTip')}
              disabled={selections.noneSelected}
              badge={selections.selected.length}
            />
          }
        />
      </div>

      <DataTable
        showHeader={false}
        headers={columns}
        data={finalData}
        tdClassName="py-3"
        variant="primary"
      />
    </PageWrapper>
  )
}

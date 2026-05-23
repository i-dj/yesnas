import { ActionMenu, type ActionMenuConfig, Button, DataTableHeader, MoreButton, Progress } from '@/components/ui'
import { cn, formatDateTime } from '@/lib/utils'
import type { Job, JobStatus } from '@/types'
import { useSelections } from 'ahooks'
import { MoreVertical, Pause, Play, Timer, Trash2, XCircle } from 'lucide-react'

import { getJobIcon, getJobStatusMeta, JobStatusMetaKey } from './_job-constants'
import { ColumnIcon } from '@/components/ui/column-icon'

const statusClassNames = {
  all: 'bg-zinc-500/10 text-zinc-500',
  running: 'bg-sky-500/10 text-sky-500',
  paused: 'bg-amber-500/10 text-amber-500',
  success: 'bg-emerald-500/10 text-emerald-500',
  failed: 'bg-red-500/10 text-red-500',
  canceled: 'bg-zinc-500/10 text-zinc-500',
} satisfies Record<JobStatusMetaKey, string>

type Translate = (key: string, values?: Record<string, string | number>) => string
type JobAction = 'pause' | 'resume' | 'cancel' | 'delete'

const jobActionItems = (job: Job, t: Translate): ActionMenuConfig[] => {
  const terminal = job.status === 'success' || job.status === 'failed' || job.status === 'cancelled'
  const paused = job.status === 'paused'

  return [
    { label: t('actions.pause'), action: 'pause', icon: Pause, disabled: terminal || paused },
    { label: t('actions.resume'), action: 'resume', icon: Play, disabled: terminal || !paused },
    { label: t('actions.cancel'), action: 'cancel', icon: XCircle, disabled: terminal },
  ]
}

export const getJobColumns = (
  selections: ReturnType<typeof useSelections<Job>>,
  t: Translate,
  timeZone: string,
  onJobAction: (job: Job, action: JobAction) => void,
): DataTableHeader<Job>[] => [
  {
    key: '__selection__',
    label: '',
    width: '48px',
    render: (_, record) => {
      const title = t(`types.${record.type}`)

      return (
        <input
          type="checkbox"
          aria-label={t('selectJob', { name: title })}
          checked={selections.isSelected(record)}
          onClick={(event) => event.stopPropagation()}
          onChange={() => selections.toggle(record)}
          className="accent-app-text h-4 w-4 cursor-pointer"
        />
      )
    },
  },
  {
    key: 'type',
    label: t('columns.name'),
    width: '280px',
    render: (_, record) => {
      const title = t(`types.${record.type}`)

      return (
        <div className="flex min-w-0 flex-col">
          <ColumnIcon icon={getJobIcon(record.type)} title={title} subTitle={record.message} className="gap-2" />
          {record.errorMessage && (
            <div className="mt-2 text-xs wrap-break-word whitespace-normal text-red-500">{record.errorMessage}</div>
          )}
        </div>
      )
    },
  },
  {
    key: 'progress',
    label: t('columns.progress'),
    render: (value: number, record) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Progress value={Math.max(0, Math.min(100, value || 0))} showLabel={false} className="bg-sky-500" />
        <div className="text-app-text-muted flex items-center justify-between gap-3 text-[11px]">
          <span>
            {t('columns.progress')}: {Math.round(value || 0)}%
          </span>
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {formatDateTime(record.updatedAt, timeZone)}
          </span>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: t('columns.status'),
    align: 'center',
    render: (value: JobStatus) => {
      const { key } = getJobStatusMeta(value)
      return (
        <div className="flex items-center justify-center text-center">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase',
              statusClassNames[key],
            )}
          >
            {t(`statuses.${key}`)}
          </span>
        </div>
      )
    },
  },
  {
    key: 'updatedAt',
    label: t('columns.updatedAt'),
    render: (value, record) => (
      <div className="flex flex-col gap-2">
        <span className="text-app-text justify-left flex items-center gap-2 text-xs">创建时间</span>
        <span className="text-app-text-muted justify-left flex items-center gap-2 text-xs">
          {formatDateTime(record.createdAt, timeZone)}
        </span>
      </div>
    ),
  },
  {
    key: '__actions__',
    label: '',
    width: '88px',
    align: 'right',
    render: (_, record) => (
      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full border-none"
          isDelete
          onClick={(event) => {
            event.stopPropagation()
            void onJobAction(record, 'delete')
          }}
        />
        <ActionMenu
          mode="left-click"
          align="end"
          onAction={(action) => onJobAction(record, action as JobAction)}
          items={jobActionItems(record, t)}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              icon={MoreVertical}
              onClick={(event) => event.stopPropagation()}
            />
          }
        />
      </div>
    ),
  },
]

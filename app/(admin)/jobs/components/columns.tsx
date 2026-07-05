import { ActionMenu, Button, Progress, Tooltip, type ActionMenuConfig, type DataTableHeader } from '@/components/ui'
import { cn, formatSmartTimeInfo } from '@/lib/utils'
import type { Job } from '@/types'
import { MoreVertical, Pause, Play, Trash2, XCircle } from 'lucide-react'

import { getJobIcon, getJobStatusMeta, type JobStatusMetaKey, JobAction } from '../constants'

type Translate = (key: string, values?: Record<string, string | number>) => string

const statusClassNames = {
  all: 'bg-zinc-500/10 text-zinc-500',
  running: 'bg-sky-500/10 text-sky-500',
  paused: 'bg-amber-500/10 text-amber-500',
  success: 'bg-emerald-500/10 text-emerald-500',
  failed: 'bg-red-500/10 text-red-500',
  canceled: 'bg-zinc-500/10 text-zinc-500',
} satisfies Record<JobStatusMetaKey, string>

function getJobActions(job: Job, t: Translate): ActionMenuConfig[] {
  const terminal = ['success', 'failed', 'cancelled'].includes(job.status)
  const paused = job.status === 'paused'

  return [
    { label: t('actions.pause'), action: 'pause', icon: Pause, disabled: terminal || paused },
    { label: t('actions.resume'), action: 'resume', icon: Play, disabled: terminal || !paused },
    { label: t('actions.cancel'), action: 'cancel', icon: XCircle, disabled: terminal },
  ]
}

export function getJobColumns({
  t,
  timeZone,
  locale,
  onJobAction,
}: {
  t: Translate
  timeZone: string
  locale: string
  onJobAction: (job: Job, action: JobAction) => void
}): DataTableHeader<Job>[] {
  return [
    {
      key: 'type',
      label: t('columns.job'),
      width: '38%',
      render: (_, job) => {
        const Icon = getJobIcon(job.type)
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-app-hover grid size-9 shrink-0 place-items-center rounded-md">
              <Icon className="text-app-text-muted size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-app-text truncate text-sm">{job.title || t(`types.${job.type}`)}</p>
              <p className={cn('text-app-text-muted mt-0.5 truncate text-sm', job.errorMessage && 'text-red-400')}>
                {job.errorMessage || [job.storagePoolName, job.message].filter(Boolean).join(' · ') || '-'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'progress',
      label: t('columns.progress'),
      width: '22%',
      render: (_, job) => {
        const progress = Math.max(0, Math.min(100, job.progress || 0))
        return (
          <div className="max-w-48">
            <Progress value={progress} showLabel={false} className="bg-sky-400" />
            <span className="text-app-text-muted mt-1 block text-xs">{Math.round(progress)}%</span>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: t('columns.status'),
      width: '14%',
      render: (_, job) => {
        const status = getJobStatusMeta(job.status).key
        return (
          <span className={cn('inline-flex rounded-full px-2 py-1 text-xs', statusClassNames[status])}>
            {t(`statuses.${status}`)}
          </span>
        )
      },
    },
    {
      key: 'updatedAt',
      label: t('columns.updatedAt'),
      width: '18%',
      render: (_, job) => {
        const updated = formatSmartTimeInfo(job.updatedAt || job.createdAt, timeZone, locale)
        return (
          <Tooltip content={updated.fullText} disabled={!updated.showTooltip} triggerClassName="w-fit">
            <span className="text-app-text-muted text-sm" suppressHydrationWarning>
              {updated.text}
            </span>
          </Tooltip>
        )
      },
    },
    {
      key: '__actions__',
      label: '',
      width: '5rem',
      align: 'right',
      render: (_, job) => (
        <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            isDelete
            tip={t('actions.delete')}
            onClick={(event) => {
              event.stopPropagation()
              onJobAction(job, 'delete')
            }}
          />
          <ActionMenu
            mode="left-click"
            align="end"
            onAction={(action) => onJobAction(job, action as JobAction)}
            items={getJobActions(job, t)}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                icon={MoreVertical}
                tip={t('actions.more')}
                onClick={(event) => event.stopPropagation()}
              />
            }
          />
        </div>
      ),
    },
  ]
}

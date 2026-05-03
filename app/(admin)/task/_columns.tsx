import { DataTableHeader, Progress } from '@/components/ui'
import { Badge, Checkbox } from '@radix-ui/themes'
import { useSelections } from 'ahooks'
import { getTaskStatusMeta } from './_constants'
import { Task } from '@/types'
import { TaskStatus } from '@/types/models/_constants'
import { Clock, FolderSync } from 'lucide-react'
import type { TranslationValues } from 'next-intl'

export const getTaskColumns = (
  selections: ReturnType<typeof useSelections<Task>>,
  t: (key: string, values?: TranslationValues) => string,
): DataTableHeader<Task>[] => [
  {
    key: 'name',
    label: t('columns.name'),
    width: '120px',
    sortable: true,
    render: (value) => (
      <div className="flex w-fit flex-col items-center gap-2">
        <div className="border-app-border bg-app-bg-muted rounded-full border p-2">
          <FolderSync className="h-4 w-4" />
        </div>
        <span className="text-[13px]">{value}</span>
      </div>
    ),
  },

  {
    key: 'progress',
    label: t('columns.progress'),
    align: 'center',
    render: (value, record) => (
      <div className="flex w-full flex-col justify-center gap-3">
        <div className="w-full truncate text-[14px] font-medium">
          {record.name}
        </div>

        {/*<div className="w-full">
          <Progress value={value} showLabel={false} className="h-2" />
        </div>*/}

        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span>184kb/s</span>
          <span className="opacity-50">|</span>
          <span>899kb / 800GB</span>
          <span className="opacity-50">|</span>
          <span>{t('columns.remaining', { duration: record.size })}</span>
          <span className="opacity-50">|</span>
          <span className="text-app-text flex flex-row items-center justify-center gap-1 text-center">
            <Clock className="h-3 w-3" />
            40%
          </span>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: t('columns.status'),
    align: 'center',
    render: (value: TaskStatus) => {
      const { key, color, icon: Icon } = getTaskStatusMeta(value)
      return (
        <div className="flex items-center justify-center text-center">
          <Badge
            color={color as any}
            variant="soft"
            radius="full"
            className="gap-1.5"
          >
            <Icon size={12} strokeWidth={2.5} />
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {t(`statuses.${key}`)}
            </span>
          </Badge>{' '}
        </div>
      )
    },
  },

  {
    key: 'updatedAt',
    label: t('columns.updatedAt'),
    width: '130px',
    sortable: true,
    render: (value) => (
      <span className="text-app-text-muted flex flex-row items-center justify-center gap-2 text-center">
        <Clock className="h-4 w-4" />
        {t('columns.updatedAgo', { value: t('columns.updatedSample') })}
      </span>
    ),
  },
]

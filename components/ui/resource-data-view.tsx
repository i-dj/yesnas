'use client'

import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Button } from './form/button'
import { Select } from './form/select'
import { DataTable, type DataTableHeader } from './data-table'

export type ResourceDataColumn<Row> = DataTableHeader<Row>

export interface ResourceDataToolbarProps {
  leading?: ReactNode
  content?: ReactNode
  actions?: ReactNode
  className?: string
}

export interface ResourceDataViewProps<Row extends { id: string | number }> {
  id: string
  data: Row[]
  columns: ResourceDataColumn<Row>[]
  page: number
  pageSize: number
  totalPages: number
  loading?: boolean
  loadingDelayMs?: number
  loadingText?: string
  emptyText?: string
  toolbar?: ReactNode
  pageSizeOptions?: readonly number[]
  className?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const defaultPageSizeOptions = [10, 20, 50] as const
const defaultLoadingDelayMs = 400

export function ResourceDataToolbar({ leading, content, actions, className }: ResourceDataToolbarProps) {
  return (
    <div
      className={cn(
        'grid w-full min-w-0 grid-cols-1 items-center gap-2 xl:grid-cols-[auto_minmax(0,1fr)_auto]',
        className,
      )}
    >
      <div className="min-w-0">{leading}</div>
      <div className="min-w-0">{content}</div>
      <div className="flex items-center gap-2 justify-self-start xl:justify-self-end">{actions}</div>
    </div>
  )
}

export function ResourceDataView<Row extends { id: string | number }>({
  id,
  data,
  columns,
  page,
  pageSize,
  totalPages,
  loading,
  loadingDelayMs = defaultLoadingDelayMs,
  loadingText = 'Data loading...',
  emptyText = 'No data found',
  toolbar,
  pageSizeOptions = defaultPageSizeOptions,
  className,
  onPageChange,
  onPageSizeChange,
}: ResourceDataViewProps<Row>) {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)
  const [showLoading, setShowLoading] = useState(false)
  const showEmpty = !loading && data.length === 0

  useEffect(() => {
    if (!loading) {
      setShowLoading(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowLoading(true)
    }, loadingDelayMs)

    return () => window.clearTimeout(timer)
  }, [loading, loadingDelayMs])

  return (
    <section className={cn('space-y-4', className)}>
      {toolbar}

      <section className="border-app-border min-h-0 overflow-hidden rounded-lg border">
        <DataTable
          headers={columns}
          data={showLoading ? [] : data}
          variant="plain"
          headerClassName="text-app-text-muted text-sm "
          tdClassName="rounded-none py-2.5"
          getRowClassName={() => '[&>td]:rounded-none'}
        />

        {showLoading || showEmpty ? (
          <div className="border-app-border/60 grid min-h-56 place-items-center border-t px-4 py-10 text-center">
            <div className="flex flex-col items-center">
              <span className="border-app-border text-app-text-muted mb-5 grid size-12 place-items-center rounded-lg border">
                <BarChart3 className="size-5" />
              </span>
              <div className="text-app-text text-sm font-semibold">{showLoading ? loadingText : emptyText}</div>
            </div>
          </div>
        ) : null}

        <div className="border-app-border/60 flex items-center justify-between border-t px-4 py-3">
          <Select
            id={`${id}-page-size`}
            value={pageSize}
            wrapperClassName="w-34"
            className="text-app-text-muted hover:bg-app-hover/35 h-8 border-transparent bg-transparent text-sm"
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                每页 {option} 条
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={ChevronLeft}
              disabled={safePage <= 1 || showLoading}
              onClick={() => onPageChange(safePage - 1)}
            />
            <span className="text-app-text-muted min-w-20 text-center text-sm">
              {safePage} / {safeTotalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={ChevronRight}
              disabled={safePage >= safeTotalPages || showLoading}
              onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
            />
          </div>
        </div>
      </section>
    </section>
  )
}

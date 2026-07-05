'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { Select } from './select'

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  pageSizeOptions?: readonly number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  loading?: boolean
  id?: string
  className?: string
  selectClassName?: string
  selectWrapperClassName?: string
  summaryClassName?: string
  pageSizeLabel?: (count: number) => string
  summaryLabel?: (page: number, totalPages: number) => string
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions = [20, 50, 100],
  onPageChange,
  onPageSizeChange,
  loading = false,
  id = 'pagination-page-size',
  className,
  selectClassName,
  selectWrapperClassName = 'w-32',
  summaryClassName,
  pageSizeLabel = (count) => `每页 ${count} 条`,
  summaryLabel = (current, total) => `${current} / ${total}`,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Select
        id={id}
        value={pageSize}
        wrapperClassName={selectWrapperClassName}
        className={cn('h-8 bg-transparent text-sm', selectClassName)}
        disabled={loading}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        {pageSizeOptions.map((option) => (
          <option key={option} value={option}>
            {pageSizeLabel(option)}
          </option>
        ))}
      </Select>

      <Button
        size="sm"
        variant="ghost"
        icon={ChevronLeft}
        disabled={safePage <= 1 || loading}
        onClick={() => onPageChange(safePage - 1)}
      />
      <span className={cn('text-app-text-muted min-w-20 text-center text-sm', summaryClassName)}>
        {summaryLabel(safePage, safeTotalPages)}
      </span>
      <Button
        size="sm"
        variant="ghost"
        icon={ChevronRight}
        disabled={safePage >= safeTotalPages || loading}
        onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
      />
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { SortDirection } from '@/types'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cva } from 'class-variance-authority'
import React from 'react'

/* ===== CVA ===== */
const headerInnerVariants = cva(
  'flex min-h-9 items-center gap-1 bg-clip-padding px-4 py-2 backdrop-blur-sm ',
  {
    variants: {
      variant: {
        default: 'bg-app-item-bg',
        primary: 'bg-app-bg font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const rowVariants = cva(
  'group file-selectable relative cursor-default transition-colors outline-none',
  {
    variants: {
      selected: {
        true: 'bg-app-active/50 hover:bg-app-hover/60',
        false: 'hover:bg-app-hover/50',
      },
    },
  },
)

const cellVariants = cva('relative px-4 py-2.5', {
  variants: {
    variant: { default: '', primary: 'border-b border-app-border/50' },
  },
})

/* ===== Helper ===== */
const getRadiusClass = (
  isFirst: boolean,
  isLast: boolean,
  hasTop: boolean,
  hasBottom: boolean,
) => {
  return cn(
    isFirst && hasTop && 'rounded-tl-lg',
    isFirst && hasBottom && 'rounded-bl-lg',
    isLast && hasTop && 'rounded-tr-lg',
    isLast && hasBottom && 'rounded-br-lg',
  )
}

/* ===== Types ===== */
export interface DataTableHeader<T> {
  key: keyof T | '__selection__' | '__actions__'
  label: React.ReactNode
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T) => React.ReactNode
}

interface DataTableProps<T extends { id: number | string }> {
  headers: DataTableHeader<T>[]
  data: T[]
  sortConfig?: { key: string; dir: SortDirection }
  onSortAction?: (key: keyof T) => void
  onRowClickAction?: (e: React.MouseEvent, row: T, index: number) => void
  onRowContextMenu?: (e: React.MouseEvent, row: T, index: number) => void
  getRowClassName?: (row: T) => string
  rowWrapper?: (row: T, children: React.ReactElement) => React.ReactNode
  selectedIds?: Set<number | string>
  tdClassName?: string
  variant?: 'default' | 'primary'
  showHeader?: boolean
}

/* ===== Component ===== */
export const DataTable = <T extends { id: number | string }>({
  headers,
  data,
  sortConfig,
  onSortAction,
  onRowClickAction,
  onRowContextMenu,
  getRowClassName,
  rowWrapper,
  tdClassName,
  variant = 'default',
  selectedIds = new Set(),
  showHeader = true,
}: DataTableProps<T>) => {
  const isRounded = variant !== 'primary'

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <thead className={cn(!showHeader && 'h-0')}>
          <tr className="select-none">
            {headers.map((h, i) => {
              const isFirst = i === 0
              const isLast = i === headers.length - 1

              return (
                <th
                  key={String(h.key)}
                  // Always keep the width style so table-fixed continues to work
                  style={{ width: h.width }}
                  className={cn(
                    'sticky top-0 z-30 p-0 text-left font-normal transition-all',
                    showHeader &&
                      variant !== 'default' &&
                      'border-app-border/50 border-b',
                    !showHeader &&
                      'pointer-events-none h-0 border-none opacity-0',
                  )}
                >
                  {showHeader && (
                    <div
                      className={cn(
                        headerInnerVariants({ variant }),
                        h.sortable && 'hover:bg-app-hover transition-colors',
                        isFirst && isRounded && 'rounded-l-lg',
                        isLast && isRounded && 'rounded-r-lg',
                        h.align === 'right' && 'justify-end',
                      )}
                      onClick={() =>
                        h.sortable && onSortAction?.(h.key as keyof T)
                      }
                    >
                      {h.label}
                      {h.sortable && (
                        <span className="shrink-0">
                          {sortConfig?.key === h.key ? (
                            sortConfig.dir === 'asc' ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ChevronsUpDown size={14} className="opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="relative [&>tr:hover+tr_.row-divider]:opacity-0 [&>tr[data-selected-end]+tr_.row-divider]:opacity-0">
          {data.map((row, i) => {
            const selected = selectedIds.has(row.id)
            const prevSelected = i > 0 && selectedIds.has(data[i - 1].id)
            const nextSelected =
              i < data.length - 1 && selectedIds.has(data[i + 1].id)
            const isStart = selected && !prevSelected
            const isEnd = selected && !nextSelected
            const hasTop = !selected || isStart
            const hasBottom = !selected || isEnd
            const rowClass = getRowClassName?.(row) || ''

            const trElement = (
              <tr
                key={row.id}
                data-id={row.id}
                data-selected={selected || undefined}
                data-selected-start={isStart || undefined}
                data-selected-end={isEnd || undefined}
                onClick={(e) => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('button') ||
                    target.closest('[role="menuitem"]') ||
                    target.closest('[data-radix-collection-item]')
                  )
                    return
                  onRowClickAction?.(e, row, i)
                }}
                onContextMenu={(e) => onRowContextMenu?.(e, row, i)}
                className={cn(rowVariants({ selected }), rowClass)}
              >
                {headers.map((h, idx) => {
                  const isFirst = idx === 0
                  const isLast = idx === headers.length - 1
                  const radiusClass =
                    isRounded &&
                    getRadiusClass(isFirst, isLast, hasTop, hasBottom)
                  return (
                    <td
                      key={`${row.id}-${String(h.key)}`}
                      className={cn(
                        cellVariants({ variant }),
                        radiusClass,
                        selected && 'bg-app-active/50',
                        tdClassName,
                      )}
                    >
                      <div
                        className={cn(
                          'row-divider absolute inset-x-0 top-0 h-px transition-opacity',
                          i === 0 && 'hidden',
                          'group-hover:opacity-0',
                          isStart && 'opacity-0',
                        )}
                      />
                      <div
                        className={cn(
                          'relative z-10 select-text',
                          h.key !== '__selection__' && 'truncate',
                        )}
                      >
                        {h.render
                          ? h.render((row as any)[h.key], row)
                          : (row as any)[h.key]}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )

            return rowWrapper ? rowWrapper(row, trElement) : trElement
          })}
        </tbody>
      </table>
    </div>
  )
}

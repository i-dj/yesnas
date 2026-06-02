'use client'

import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import React, { useMemo, useState } from 'react'

export interface TableHeader<T> {
  key: string
  label: string
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T) => React.ReactNode
}

interface TableProps<T extends { id: string | number }> {
  headers: TableHeader<T>[]
  data: T[]
  onRowClick?: (e: React.MouseEvent, row: T, index: number) => void
  getRowClassName?: (row: T) => string
}

export const Table = <T extends { id: string | number }>({
  headers,
  data,
  onRowClick,
  getRowClassName,
}: TableProps<T>) => {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' | null }>({
    key: '',
    dir: null,
  })

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.dir) return data
    return [...data].sort((a, b) => {
      const valA = (a as any)[sort.key]
      const valB = (b as any)[sort.key]
      if (valA === valB) return 0
      const result = valA > valB ? 1 : -1
      return sort.dir === 'asc' ? result : -result
    })
  }, [data, sort])

  return (
    <div className="w-full">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                style={{ width: h.width }}
                onClick={() =>
                  h.sortable &&
                  setSort({
                    key: h.key,
                    dir: sort.key === h.key && sort.dir === 'asc' ? 'desc' : 'asc',
                  })
                }
                className={cn(
                  'sticky top-0 z-10 bg-neutral-100/90 px-4 py-2 text-left font-medium text-neutral-500 backdrop-blur first:rounded-l-lg last:rounded-r-lg',
                  h.sortable && 'cursor-pointer select-none',
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-1',
                    h.align === 'right' && 'justify-end',
                    h.align === 'center' && 'justify-center',
                  )}
                >
                  {h.label}
                  {h.sortable &&
                    (sort.key === h.key ? (
                      sort.dir === 'asc' ? (
                        <ArrowUp size={14} />
                      ) : (
                        <ArrowDown size={14} />
                      )
                    ) : (
                      <ChevronsUpDown size={14} className="opacity-30" />
                    ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => {
            const rowClass = getRowClassName?.(row) || ''
            const isSelected = rowClass.includes('bg-tesla')

            return (
              <tr
                key={row.id}
                data-id={row.id}
                onClick={(e) => onRowClick?.(e, row, i)}
                onContextMenu={(e) => {
                  if (!isSelected) onRowClick?.(e, row, i)
                }}
                className={cn(
                  'group file-selectable cursor-default transition-colors duration-150',
                  rowClass || 'hover:bg-neutral-100',
                )}
              >
                {headers.map((h, idx) => (
                  <td
                    key={`${String(row.id)}-${h.key}`}
                    className={cn(
                      'relative px-4 py-3 first:rounded-l-xl last:rounded-r-xl',
                      h.align === 'right' && 'text-right',
                      h.align === 'center' && 'text-center',
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-x-0 bottom-0 h-px bg-neutral-100 group-last:hidden',
                        idx === 0 && 'left-2',
                        idx === headers.length - 1 && 'right-2',
                      )}
                    />
                    <div className="relative z-10 select-none">
                      {h.render ? h.render((row as any)[h.key], row) : (row as any)[h.key]}
                    </div>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

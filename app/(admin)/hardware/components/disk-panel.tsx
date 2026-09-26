'use client'

import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpDown,
  ArrowUpFromLine,
  Columns3,
  GripVertical,
  HardDrive,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'

import { ActionMenu, Button, Checkbox, StatusPill, Tooltip } from '@/components/ui'
import { bytesFormat, cn, formatBytes } from '@/lib/utils'
import type { HardwareDisk } from '@/types'
import { HardwareMetrics } from './hardware-section'
import { formatDiskUsage, formatOptional, formatSpeed, isHealthyDisk } from '../utils'

type DiskColumnKey =
  | 'capacity'
  | 'temperature'
  | 'status'
  | 'io'
  | 'type'
  | 'path'
  | 'serial'
  | 'transport'
  | 'filesystem'
  | 'mountpoints'
  | 'usage'
  | 'health'
  | 'powerOnTime'
  | 'powerCycles'
  | 'unsafeShutdowns'
  | 'readTotal'
  | 'writeTotal'
  | 'readOps'
  | 'writeOps'
  | 'partitions'

type DiskSortKey = 'disk' | DiskColumnKey
type SortDirection = 'asc' | 'desc'

interface DiskColumn {
  key: DiskColumnKey
  label: string
  width: string
  defaultVisible?: boolean
  render: (disk: HardwareDisk) => ReactNode
  sortValue: (disk: HardwareDisk) => string | number | undefined
}

export function DiskSummary({ disks }: { disks: HardwareDisk[] }) {
  const t = useTranslations('Hardware')
  const healthyCount = disks.filter((disk) => isHealthyDisk(disk)).length
  const totalCapacity = disks.reduce((total, disk) => total + disk.sizeBytes, 0)
  const totalIo = disks.reduce((total, disk) => total + disk.readBytesPerSec + disk.writeBytesPerSec, 0)

  return (
    <HardwareMetrics
      items={[
        { label: t('overview.healthyDisks'), value: `${healthyCount}/${disks.length}` },
        { label: t('fields.totalCapacity'), value: formatBytes(totalCapacity) },
        { label: t('overview.totalIo'), value: formatSpeed(totalIo) },
      ]}
    />
  )
}

export function DiskList({ disks }: { disks: HardwareDisk[] }) {
  const t = useTranslations('Hardware')
  const columns = useMemo(() => createDiskColumns(t), [t])
  const [visibleColumns, setVisibleColumns] = useState<Set<DiskColumnKey>>(
    () => new Set(columns.filter((column) => column.defaultVisible).map((column) => column.key)),
  )
  const [columnOrder, setColumnOrder] = useState<DiskColumnKey[]>(() => columns.map((column) => column.key))
  const [draggedColumn, setDraggedColumn] = useState<DiskColumnKey | null>(null)
  const [sort, setSort] = useState<{ key: DiskSortKey; direction: SortDirection }>({
    key: 'disk',
    direction: 'asc',
  })
  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((key) => columns.find((column) => column.key === key))
        .filter((column): column is DiskColumn => Boolean(column)),
    [columnOrder, columns],
  )
  const activeColumns = orderedColumns.filter((column) => visibleColumns.has(column.key))
  const tableMinWidth = 23 + activeColumns.reduce((total, column) => total + Number.parseFloat(column.width), 0)
  const sortedDisks = useMemo(() => {
    const column = columns.find((item) => item.key === sort.key)
    const getValue = sort.key === 'disk' ? getDiskIdentitySortValue : column?.sortValue

    return [...disks].sort((left, right) => compareDiskValues(getValue?.(left), getValue?.(right), sort.direction))
  }, [columns, disks, sort])

  const toggleColumn = (key: DiskColumnKey) => {
    setVisibleColumns((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        if (next.size <= 1) return next
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleSort = (key: DiskSortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const moveColumn = (sourceKey: DiskColumnKey, targetKey: DiskColumnKey) => {
    setColumnOrder((current) => {
      const sourceIndex = current.indexOf(sourceKey)
      const targetIndex = current.indexOf(targetKey)

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current

      const next = [...current]
      const [source] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, source)
      return next
    })
  }

  return (
    <div className="border-card-border bg-card-bg relative overflow-hidden rounded-lg border">
      <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table
          className="w-full table-fixed border-separate border-spacing-0 text-sm"
          style={{ minWidth: `${tableMinWidth}rem` }}
        >
          <thead>
            <tr>
              <DiskHeaderCell
                sticky
                width="20rem"
                sortDirection={sort.key === 'disk' ? sort.direction : undefined}
                onSort={() => toggleSort('disk')}
              >
                {t('sections.disks')}
              </DiskHeaderCell>
              {activeColumns.map((column) => (
                <DiskHeaderCell
                  key={column.key}
                  width={column.width}
                  sortDirection={sort.key === column.key ? sort.direction : undefined}
                  onSort={() => toggleSort(column.key)}
                >
                  {column.label}
                </DiskHeaderCell>
              ))}
              <DiskHeaderCell width="3rem" stickyRight className="px-0 text-center">
                <ActionMenu
                  mode="left-click"
                  align="end"
                  items={[
                    {
                      render: () => (
                        <DiskColumnMenu
                          title={t('fields.showColumns')}
                          columns={orderedColumns}
                          visibleColumns={visibleColumns}
                          draggedColumn={draggedColumn}
                          onToggle={toggleColumn}
                          onDragStart={setDraggedColumn}
                          onDragEnd={() => setDraggedColumn(null)}
                          onMove={moveColumn}
                        />
                      ),
                    },
                  ]}
                  onAction={() => {}}
                  contentClassName="w-64 max-h-[min(34rem,calc(100vh-8rem))] overflow-x-hidden overflow-y-auto px-1.5 py-1.5"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Columns3}
                      iconSize={15}
                      noHover
                      className="text-app-text-muted hover:text-app-text mx-auto h-8 w-8 px-0"
                      aria-label={t('fields.columns')}
                      tip={t('fields.columns')}
                    />
                  }
                />
              </DiskHeaderCell>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {sortedDisks.map((disk) => (
              <tr key={disk.path} className="group">
                <DiskBodyCell sticky className="bg-card-bg group-hover:bg-app-hover">
                  <DiskIdentity disk={disk} />
                </DiskBodyCell>
                {activeColumns.map((column) => (
                  <DiskBodyCell key={column.key}>{column.render(disk)}</DiskBodyCell>
                ))}
                <DiskBodyCell stickyRight className="w-12 px-0" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DiskColumnMenu({
  title,
  columns,
  visibleColumns,
  draggedColumn,
  onToggle,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  title: string
  columns: DiskColumn[]
  visibleColumns: Set<DiskColumnKey>
  draggedColumn: DiskColumnKey | null
  onToggle: (key: DiskColumnKey) => void
  onDragStart: (key: DiskColumnKey) => void
  onDragEnd: () => void
  onMove: (sourceKey: DiskColumnKey, targetKey: DiskColumnKey) => void
}) {
  const handleDragStart = (event: DragEvent<HTMLDivElement>, key: DiskColumnKey) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', key)
    onDragStart(key)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>, key: DiskColumnKey) => {
    event.preventDefault()
    if (draggedColumn && draggedColumn !== key) {
      onMove(draggedColumn, key)
    }
  }

  return (
    <div className="min-w-0">
      <div className="border-app-border mb-2 border-b px-2 py-2 select-none">
        <span className="text-app-text-sub text-[11px] leading-none font-bold tracking-widest uppercase">{title}</span>
      </div>
      <div className="grid gap-1">
        {columns.map((column) => {
          const checked = visibleColumns.has(column.key)
          const disabled = checked && visibleColumns.size <= 1

          return (
            <div
              key={column.key}
              draggable
              onDragStart={(event) => handleDragStart(event, column.key)}
              onDragOver={(event) => handleDragOver(event, column.key)}
              onDragEnd={onDragEnd}
              className={cn(
                'border-app-border bg-app-bg hover:bg-app-hover flex items-center gap-1 rounded-lg border px-1.5 py-1 transition',
                draggedColumn === column.key && 'opacity-45',
              )}
            >
              <span className="text-app-text-sub grid size-6 shrink-0 cursor-grab place-items-center active:cursor-grabbing">
                <GripVertical className="size-3.5" />
              </span>
              <Checkbox
                label={column.label}
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(column.key)}
                className="h-7 min-w-0 flex-1 px-1"
                contentClassName="text-sm"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function createDiskColumns(t: ReturnType<typeof useTranslations>): DiskColumn[] {
  return [
    {
      key: 'capacity',
      label: t('fields.capacity'),
      width: '8rem',
      defaultVisible: true,
      render: (disk) => <DiskValue value={bytesFormat(disk.sizeBytes, { standard: 'm', decimalPlaces: 0 })} strong />,
      sortValue: (disk) => disk.sizeBytes,
    },
    {
      key: 'temperature',
      label: t('fields.temperature'),
      width: '8rem',
      defaultVisible: true,
      render: (disk) => <DiskValue value={formatOptional(disk.temperatureC, ' °C')} strong />,
      sortValue: (disk) => disk.temperatureC,
    },
    {
      key: 'status',
      label: t('fields.status'),
      width: '10rem',
      defaultVisible: true,
      render: (disk) => <DiskStatus disk={disk} />,
      sortValue: (disk) => Number(isHealthyDisk(disk)) * 2 + Number(disk.inUse),
    },
    {
      key: 'io',
      label: t('fields.realtimeIo'),
      width: '9rem',
      defaultVisible: true,
      render: (disk) => <DiskIo disk={disk} />,
      sortValue: (disk) => disk.readBytesPerSec + disk.writeBytesPerSec,
    },
    {
      key: 'type',
      label: t('fields.diskType'),
      width: '9rem',
      defaultVisible: true,
      render: (disk) => <DiskValue value={formatDiskType(disk)} />,
      sortValue: (disk) => formatDiskType(disk),
    },
    {
      key: 'path',
      label: t('fields.devicePath'),
      width: '11rem',
      render: (disk) => <DiskValue value={disk.path || '-'} />,
      sortValue: (disk) => disk.path,
    },
    {
      key: 'serial',
      label: t('fields.serial'),
      width: '13rem',
      render: (disk) => <DiskValue value={disk.serial || '-'} />,
      sortValue: (disk) => disk.serial,
    },
    {
      key: 'transport',
      label: t('fields.transport'),
      width: '8rem',
      render: (disk) => <DiskValue value={formatText(disk.transport)} />,
      sortValue: (disk) => disk.transport,
    },
    {
      key: 'filesystem',
      label: t('fields.filesystem'),
      width: '8rem',
      render: (disk) => <DiskValue value={formatText(disk.fsType)} />,
      sortValue: (disk) => disk.fsType,
    },
    {
      key: 'mountpoints',
      label: t('fields.mountpoints'),
      width: '16rem',
      render: (disk) => <DiskValue value={formatList(disk.mountpoints)} />,
      sortValue: (disk) => formatList(disk.mountpoints),
    },
    {
      key: 'usage',
      label: t('fields.usage'),
      width: '9rem',
      render: (disk) => <DiskValue value={formatDiskUsage(disk.usage, t)} />,
      sortValue: (disk) => formatDiskUsage(disk.usage, t),
    },
    {
      key: 'health',
      label: t('fields.health'),
      width: '8rem',
      render: (disk) => <DiskValue value={formatOptional(disk.healthPercent, '%')} />,
      sortValue: (disk) => disk.healthPercent,
    },
    {
      key: 'powerOnTime',
      label: t('fields.powerOnTime'),
      width: '9rem',
      render: (disk) => (
        <DiskValue value={disk.powerOnHours === undefined ? '-' : t('values.hours', { value: disk.powerOnHours })} />
      ),
      sortValue: (disk) => disk.powerOnHours,
    },
    {
      key: 'powerCycles',
      label: t('fields.powerCycles'),
      width: '8rem',
      render: (disk) => <DiskValue value={disk.powerCycleCount === undefined ? '-' : String(disk.powerCycleCount)} />,
      sortValue: (disk) => disk.powerCycleCount,
    },
    {
      key: 'unsafeShutdowns',
      label: t('fields.unsafeShutdowns'),
      width: '8rem',
      render: (disk) => (
        <DiskValue value={disk.unsafeShutdownCount === undefined ? '-' : String(disk.unsafeShutdownCount)} />
      ),
      sortValue: (disk) => disk.unsafeShutdownCount,
    },
    {
      key: 'readTotal',
      label: t('fields.readTotal'),
      width: '8rem',
      render: (disk) => <DiskValue value={formatBytesValue(disk.readBytesTotal)} />,
      sortValue: (disk) => disk.readBytesTotal,
    },
    {
      key: 'writeTotal',
      label: t('fields.writeTotal'),
      width: '8rem',
      render: (disk) => <DiskValue value={formatBytesValue(disk.writeBytesTotal)} />,
      sortValue: (disk) => disk.writeBytesTotal,
    },
    {
      key: 'readOps',
      label: t('fields.readOps'),
      width: '9rem',
      render: (disk) => <DiskValue value={formatCount(disk.readOpsTotal)} />,
      sortValue: (disk) => disk.readOpsTotal,
    },
    {
      key: 'writeOps',
      label: t('fields.writeOps'),
      width: '9rem',
      render: (disk) => <DiskValue value={formatCount(disk.writeOpsTotal)} />,
      sortValue: (disk) => disk.writeOpsTotal,
    },
    {
      key: 'partitions',
      label: t('fields.partitions'),
      width: '20rem',
      render: (disk) => <DiskValue value={formatPartitions(disk)} />,
      sortValue: (disk) => formatPartitions(disk),
    },
  ]
}

function DiskHeaderCell({
  children,
  sticky,
  stickyRight,
  width,
  sortDirection,
  onSort,
  className,
}: {
  children: ReactNode
  sticky?: boolean
  stickyRight?: boolean
  width: string
  sortDirection?: SortDirection
  onSort?: () => void
  className?: string
}) {
  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <th
      style={{ width }}
      aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'border-card-border bg-card-bg text-app-text-muted border-b px-4 py-4 text-left text-sm font-medium',
        sticky && 'sticky left-0 z-20',
        stickyRight && 'sticky right-0 z-20',
        className,
      )}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className="hover:text-app-text inline-flex max-w-full items-center gap-1.5 rounded-lg text-left transition"
        >
          <span className="truncate">{children}</span>
          <SortIcon className={cn('size-3 shrink-0 opacity-45', sortDirection && 'text-app-text opacity-100')} />
        </button>
      ) : (
        children
      )}
    </th>
  )
}

function DiskBodyCell({
  children,
  sticky,
  stickyRight,
  className,
}: {
  children?: ReactNode
  sticky?: boolean
  stickyRight?: boolean
  className?: string
}) {
  return (
    <td
      className={cn(
        'border-card-border bg-card-bg group-hover:bg-app-hover border-b px-4 py-4 align-middle transition-colors',
        sticky && 'sticky left-0 z-10 shadow-[1px_0_0_var(--color-card-border)]',
        stickyRight && 'sticky right-0 z-10',
        className,
      )}
    >
      {children}
    </td>
  )
}

function DiskIdentity({ disk }: { disk: HardwareDisk }) {
  const t = useTranslations('Hardware')

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="border-card-border bg-app-bg grid size-9 shrink-0 place-items-center rounded-lg border">
        <HardDrive className="text-app-text-muted size-4" />
      </span>
      <div className="min-w-0">
        <Tooltip content={disk.model || disk.name || '-'} triggerClassName="block min-w-0">
          <p className="text-app-text truncate text-sm font-semibold">{disk.model || disk.name || '-'}</p>
        </Tooltip>
        <p className="text-app-text-muted mt-0.5 truncate text-xs">
          {disk.path || disk.name || '-'} · {formatDiskUsage(disk.usage, t)}
        </p>
      </div>
    </div>
  )
}

function DiskStatus({ disk }: { disk: HardwareDisk }) {
  const t = useTranslations('Hardware')
  const smartLabel = disk.smartAvailable
    ? disk.smartPassed
      ? t('statuses.passed')
      : t('statuses.abnormal')
    : t('statuses.unsupported')

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <StatusPill color={isHealthyDisk(disk) ? 'success' : 'neutral'} content={smartLabel} />
      <StatusPill
        color={disk.inUse ? 'success' : 'neutral'}
        content={disk.inUse ? t('statuses.inUse') : t('statuses.unused')}
      />
    </div>
  )
}

function DiskIo({ disk }: { disk: HardwareDisk }) {
  return (
    <div className="text-app-text grid min-w-0 gap-1 text-xs">
      <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
        <ArrowDownToLine className="size-3 text-sky-400" />
        <span className="truncate">{formatSpeed(disk.readBytesPerSec)}</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
        <ArrowUpFromLine className="size-3 text-violet-400" />
        <span className="truncate">{formatSpeed(disk.writeBytesPerSec)}</span>
      </span>
    </div>
  )
}

function DiskValue({ value, strong }: { value: string; strong?: boolean }) {
  return (
    <Tooltip content={value} triggerClassName="block min-w-0">
      <span className={cn('text-app-text block truncate text-sm tabular-nums', strong && 'text-base font-semibold')}>
        {value}
      </span>
    </Tooltip>
  )
}

function formatDiskType(disk: HardwareDisk) {
  const transport = disk.transport?.trim()
  const transportLabel = transport ? transport.toUpperCase() : ''

  if (disk.rotationRateRpm && disk.rotationRateRpm > 0) {
    return transportLabel ? `${transportLabel} HDD` : 'HDD'
  }

  if (transportLabel === 'NVME') return 'NVMe SSD'
  if (transportLabel === 'USB') return 'USB'
  if (transportLabel) return transportLabel

  return '-'
}

function formatText(value?: string | null) {
  return value?.trim() || '-'
}

function formatList(values?: string[]) {
  const filtered = values?.filter(Boolean) ?? []
  return filtered.length ? filtered.join(', ') : '-'
}

function formatBytesValue(value?: number) {
  return value === undefined ? '-' : bytesFormat(value, { standard: 'm', decimalPlaces: 2 })
}

function formatCount(value?: number) {
  return value === undefined ? '-' : value.toLocaleString()
}

function formatPartitions(disk: HardwareDisk) {
  if (!disk.partitions?.length) return '-'

  return disk.partitions
    .map((partition) => {
      const size = bytesFormat(partition.sizeBytes, { standard: 'm', decimalPlaces: 2 })
      const fsType = partition.fsType ? ` · ${partition.fsType}` : ''
      return `${partition.path}${fsType} · ${size}`
    })
    .join(' / ')
}

function getDiskIdentitySortValue(disk: HardwareDisk) {
  return disk.model || disk.name || disk.path || ''
}

function compareDiskValues(
  left: string | number | undefined,
  right: string | number | undefined,
  direction: SortDirection,
) {
  const factor = direction === 'asc' ? 1 : -1

  if (typeof left === 'number' || typeof right === 'number') {
    const leftValue = typeof left === 'number' ? left : Number.NEGATIVE_INFINITY
    const rightValue = typeof right === 'number' ? right : Number.NEGATIVE_INFINITY
    return (leftValue - rightValue) * factor
  }

  return (
    String(left ?? '').localeCompare(String(right ?? ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    }) * factor
  )
}

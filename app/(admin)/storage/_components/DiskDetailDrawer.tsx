'use client'

import { SideDrawer, StatusPill } from '@/components/ui'
import { bytesFormat, hoursFormat } from '@/lib/utils'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'

interface DiskDetailDrawerProps {
  disk: DiskModel | null
  storagePools?: StoragePoolModel[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const prettyValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

const prettyNumber = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return value.toLocaleString()
}

const partitionColors = [
  'bg-cyan-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-pink-400',
  'bg-sky-400',
]

const usageTypeColor = (type?: string) => {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'system') return 'bg-cyan-400'
  if (normalized === 'storage_pool') return 'bg-emerald-400'
  if (normalized === 'cache') return 'bg-violet-400'
  if (normalized === 'unused') return 'bg-amber-400'
  return 'bg-sky-400'
}

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="bg-app-bg border-app-border rounded-lg border p-2">
    <div className="text-app-text-muted text-[11px] font-semibold uppercase">
      {label}
    </div>
    <div className="text-app-text mt-1 text-sm break-all">
      {prettyValue(value)}
    </div>
  </div>
)

const toPathList = (pool: StoragePoolModel): string[] => {
  const fromArrays: unknown[] = [
    pool.paths,
    pool.memberPaths,
    pool.devices,
    pool.disks,
  ]
  const values: string[] = []
  for (const item of fromArrays) {
    if (!Array.isArray(item)) continue
    for (const part of item) {
      if (typeof part === 'string') {
        values.push(part)
      } else if (part && typeof part === 'object') {
        const path = (part as { path?: string }).path
        const name = (part as { name?: string }).name
        if (path) values.push(path)
        if (name) values.push(name)
      }
    }
  }
  return values
}

export function DiskDetailDrawer({
  disk,
  storagePools = [],
  open,
  onOpenChange,
}: DiskDetailDrawerProps) {
  const partitions = disk?.partitions ?? []
  const layoutSegments = disk
    ? partitions.length > 0
      ? partitions.map((partition, index) => {
          const firstUsage = partition.usages?.[0]
          const usageType = firstUsage?.type || partition.usage
          const mountPoint =
            firstUsage?.mountpoint || partition.mountpoints?.[0] || ''
          const fsType = partition.fsType ? ` · ${partition.fsType}` : ''
          const mount = mountPoint ? ` (${mountPoint})` : ''
          return {
            key: partition.path,
            name: `${partition.name}${fsType}${mount}`,
            sizeText: partition.sizeHuman || partition.size || '-',
            bytes:
              typeof partition.sizeBytes === 'number' &&
              Number.isFinite(partition.sizeBytes)
                ? partition.sizeBytes
                : 0,
            colorClass:
              usageTypeColor(usageType) ||
              partitionColors[index % partitionColors.length],
          }
        })
      : [
          {
            key: disk.path,
            name: `${disk.name} · ${disk.fsType}  ${disk.mountpoints?.[0] ? ` (${disk.mountpoints[0]})` : ''}`,
            sizeText:
              typeof disk.sizeBytes === 'number' && Number.isFinite(disk.sizeBytes)
                ? bytesFormat(disk.sizeBytes, { standard: 'm', decimalPlaces: 2 })
                : disk.size || '-',
            bytes:
              typeof disk.sizeBytes === 'number' &&
              Number.isFinite(disk.sizeBytes)
                ? disk.sizeBytes
                : 0,
            colorClass: usageTypeColor(disk.usage),
          },
        ]
    : []
  const layoutTotalBytes = Math.max(
    layoutSegments.reduce((sum, item) => sum + item.bytes, 0),
    1,
  )
  const storagePoolNames = disk
    ? storagePools
        .filter((pool) => {
          const members = toPathList(pool)
          if (members.length === 0) return false
          const diskNames = new Set(
            [
              disk.path,
              disk.name,
              disk.kernelName,
              ...partitions.flatMap((p) => [p.path, p.name, p.kernelName]),
            ].filter(Boolean),
          )
          return members.some((member) => {
            return (
              diskNames.has(member) ||
              member === disk.path ||
              member === disk.name ||
              member === disk.kernelName
            )
          })
        })
        .map((pool) => pool.name || pool.id)
        .filter((name): name is string => Boolean(name))
    : []

  const relatedStoragePools = disk
    ? (() => {
        const usages = [
          ...(disk.usages ?? []),
          ...partitions.flatMap((p) => p.usages ?? []),
        ]
        const names = new Set<string>()
        for (const usage of usages) {
          if (usage.type !== 'storage_pool') continue
          const name = usage.storagePoolName || usage.label
          if (name) names.add(name)
        }
        for (const name of storagePoolNames) names.add(name)
        for (const name of cachePoolNames) names.add(name)
        return Array.from(names)
      })()
    : []

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={'Disk Details'}>
      {!disk ? (
        <div className="text-app-text-muted text-sm">No disk selected.</div>
      ) : (
        <div className="space-y-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold">{disk.model} </span>
                <span className="text-app-text-muted mb-3 text-sm">
                  SN:{disk.serial}
                </span>
              </div>
              <div className="border-app-border flex flex-col gap-0.5 rounded-lg border p-2 text-center">
                <span className="text-sm font-semibold">{disk.size}</span>
                <span className="text-xs">
                  {disk.inUse ? 'IN USE' : 'UNUSED'}
                </span>
              </div>
            </div>
            {layoutSegments.length > 0 && (
              <div className="bg-app-bg border-app-border space-y-2 rounded-lg border p-3">
                <div className="text-app-text text-xs font-semibold uppercase">
                  Partition Layout
                </div>

                <div className="bg-app-surface flex h-2.5 w-full overflow-hidden rounded-full">
                  {layoutSegments.map((segment, index) => {
                    const bytes = segment.bytes
                    const widthPct = Math.max(
                      (bytes / layoutTotalBytes) * 100,
                      0.8,
                    )
                    return (
                      <span
                        key={segment.key}
                        className={`${segment.colorClass || partitionColors[index % partitionColors.length]} h-full min-w-[2px]`}
                        style={{ width: `${widthPct}%` }}
                        title={`${segment.name} · ${segment.sizeText}`}
                      />
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {layoutSegments.map((segment, index) => (
                    <div
                      key={segment.key}
                      className="flex min-w-[220px] items-center gap-2 text-xs"
                    >
                      <span
                        className={`${segment.colorClass || partitionColors[index % partitionColors.length]} h-2.5 w-2.5 rounded-full`}
                      />
                      <span className="text-app-text-muted truncate">
                        {segment.name}
                      </span>
                      <span className="text-app-text ml-auto font-medium">
                        {segment.sizeText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field label="Path" value={disk.path} />
              <Field label="Vendor" value={disk.vendor} />
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field label="Transport" value={disk.transport.toUpperCase()} />
              <div className="bg-app-bg border-app-border rounded-lg border p-2">
                <div className="text-app-text-muted text-[11px] font-semibold uppercase">
                  Storage Pools
                </div>
                {relatedStoragePools.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {relatedStoragePools.map((item, index) => (
                      <StatusPill
                        key={index}
                        content={item}
                        color={'neutral'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-app-text mt-1 text-sm">None</div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-app-text text-sm font-semibold">
              Health & SMART
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field label="Health" value={disk.health.toUpperCase()} />
              <Field label="Temperature" value={`${disk.temperatureC}°C`} />
              <Field label="SMART Available" value={disk.smartAvailable} />
              <Field label="SMART Passed" value={disk.smartPassed} />
              <Field label="Read Only" value={disk.readOnly} />
              <Field
                label="Power On Hours"
                value={hoursFormat(disk.powerOnHours)}
              />
              <Field label="Power Cycle Count" value={disk.powerCycleCount} />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-app-text text-sm font-semibold">
              I/O Statistics
            </h3>
            <div className="border-app-border overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-app-bg">
                  <tr className="text-app-text-muted text-xs">
                    <th className="px-3 py-2 text-left font-semibold">
                      Metric
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      'Read Bytes Total',
                      bytesFormat(disk.readBytesTotal, {
                        standard: 'm',
                        decimalPlaces: 2,
                      }),
                    ],
                    [
                      'Write Bytes Total',
                      bytesFormat(disk.writeBytesTotal, {
                        standard: 'm',
                        decimalPlaces: 2,
                      }),
                    ],
                    ['Read Ops Total', prettyNumber(disk.readOpsTotal)],
                    ['Write Ops Total', prettyNumber(disk.writeOpsTotal)],
                  ].map(([metric, value]) => (
                    <tr
                      key={String(metric)}
                      className="border-app-border border-t"
                    >
                      <td className="text-app-text-muted px-3 py-2">
                        {metric}
                      </td>
                      <td className="text-app-text px-3 py-2">
                        {prettyValue(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </SideDrawer>
  )
}

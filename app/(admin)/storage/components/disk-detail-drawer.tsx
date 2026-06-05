'use client'

import { SideDrawer, StatusPill } from '@/components/ui'
import { bytesFormat, hoursFormat } from '@/lib/utils'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { Activity, ShieldCheck } from 'lucide-react'

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

const getBytes = (value?: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const partitionColors = ['bg-cyan-400', 'bg-emerald-400', 'bg-amber-400', 'bg-violet-400', 'bg-pink-400', 'bg-sky-400']

const usageTypeColor = (type?: string) => {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'system') return 'bg-cyan-400'
  if (normalized === 'storage_pool') return 'bg-emerald-400'
  if (normalized === 'unused') return 'bg-amber-400'
  return 'bg-sky-400'
}

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="bg-app-bg border-app-border rounded-lg border p-2">
    <div className="text-app-text-muted text-[11px] font-semibold uppercase">{label}</div>
    <div className="text-app-text mt-1 text-xs break-all">{prettyValue(value)}</div>
  </div>
)

const toPoolMemberSet = (pool: StoragePoolModel): Set<string> =>
  new Set(
    (pool.devices ?? []).flatMap((device) =>
      [device.path, device.devicePath, device.name, device.deviceName, device.kernelName].filter(Boolean),
    ) as string[],
  )

export function DiskDetailDrawer({ disk, storagePools = [], open, onOpenChange }: DiskDetailDrawerProps) {
  const partitions = disk?.partitions ?? []
  const diskIdentitySet = new Set(
    [disk?.path, disk?.name, disk?.kernelName, ...partitions.flatMap((p) => [p.path, p.name, p.kernelName])].filter(
      Boolean,
    ) as string[],
  )

  const layoutSegments = disk
    ? partitions.length > 0
      ? partitions.map((partition, index) => {
          const firstUsage = partition.usages?.[0]
          const usageType = firstUsage?.type || partition.usage
          const mountPoint = firstUsage?.mountpoint || partition.mountpoints?.[0] || ''
          const fsType = partition.fsType ? ` · ${partition.fsType}` : ''
          const mount = mountPoint ? ` (${mountPoint})` : ''
          return {
            key: partition.path,
            name: `${partition.name}${fsType}${mount}`,
            sizeText:
              bytesFormat(partition.sizeBytes, {
                decimalPlaces: 0,
              }) || '-',
            bytes: getBytes(partition.sizeBytes),
            colorClass: usageTypeColor(usageType) || partitionColors[index % partitionColors.length],
          }
        })
      : [
          {
            key: disk.path,
            name: `${disk.name} · ${disk.fsType}  ${disk.mountpoints?.[0] ? ` (${disk.mountpoints[0]})` : ''}`,
            sizeText: disk.sizeBytes
              ? bytesFormat(disk.sizeBytes, {
                  decimalPlaces: 0,
                })
              : disk.size || '-',
            bytes: getBytes(disk.sizeBytes),
            colorClass: usageTypeColor(disk.usage),
          },
        ]
    : []
  const layoutTotalBytes = Math.max(
    layoutSegments.reduce((sum, item) => sum + item.bytes, 0),
    1,
  )
  const relatedStoragePools = disk
    ? (() => {
        const names = new Set<string>()
        for (const usage of [...(disk.usages ?? []), ...partitions.flatMap((p) => p.usages ?? [])]) {
          if (usage.type !== 'storage_pool') continue
          const name = usage.storagePoolName || usage.label
          if (name) names.add(name)
        }
        for (const pool of storagePools) {
          const memberSet = toPoolMemberSet(pool)
          if ([...diskIdentitySet].some((key) => memberSet.has(key))) {
            names.add(pool.name || pool.id)
          }
        }
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
                <span className="text-app-text-muted mb-3 text-sm">SN:{disk.serial}</span>
              </div>
              <div className="border-app-border flex flex-col gap-0.5 rounded-lg border p-2 text-center">
                <span className="text-sm font-semibold">
                  {bytesFormat(disk.sizeBytes, {
                    decimalPlaces: 0,
                  })}
                </span>
                <span className="text-xs">{disk.inUse ? 'IN USE' : 'UNUSED'}</span>
              </div>
            </div>
            {layoutSegments.length > 0 && (
              <div className="bg-app-bg border-app-border space-y-2 rounded-lg border p-3">
                <div className="text-app-text text-xs font-semibold uppercase">Partition Layout</div>

                <div className="bg-app-surface flex h-2.5 w-full overflow-hidden rounded-full">
                  {layoutSegments.map((segment, index) => {
                    const bytes = segment.bytes
                    const widthPct = Math.max((bytes / layoutTotalBytes) * 100, 0.8)
                    return (
                      <span
                        key={segment.key}
                        className={`${segment.colorClass || partitionColors[index % partitionColors.length]} h-full min-w-0.5`}
                        style={{ width: `${widthPct}%` }}
                        title={`${segment.name} · ${segment.sizeText}`}
                      />
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {layoutSegments.map((segment, index) => (
                    <div key={segment.key} className="flex min-w-55 items-center gap-2 text-xs">
                      <span
                        className={`${segment.colorClass || partitionColors[index % partitionColors.length]} h-2.5 w-2.5 rounded-full`}
                      />
                      <span className="text-app-text-muted truncate">{segment.name}</span>
                      <span className="text-app-text ml-auto font-medium">{segment.sizeText}</span>
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
                <div className="text-app-text-muted text-[11px] font-semibold uppercase">Storage Pools</div>
                {relatedStoragePools.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {relatedStoragePools.map((item, index) => (
                      <StatusPill key={index} content={item} color={'neutral'} />
                    ))}
                  </div>
                ) : (
                  <div className="text-app-text mt-1 text-sm">None</div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="text-app-text-muted h-3.5 w-3.5" />
              <div className="text-app-text text-xs font-semibold uppercase">Health & SMART</div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Field label="Health" value={disk.health.toUpperCase()} />
              <Field label="Temperature" value={`${disk.temperatureC}°C`} />
              <Field label="SMART Available" value={disk.smartAvailable} />
              <Field label="SMART Passed" value={disk.smartPassed} />
              <Field label="Read Only" value={disk.readOnly} />
              <Field label="Power On Hours" value={hoursFormat(disk.powerOnHours)} />
              <Field label="Power Cycle Count" value={disk.powerCycleCount} />
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Activity className="text-app-text-muted h-3.5 w-3.5" />
              <div className="text-app-text text-xs font-semibold uppercase">I/O Statistics</div>
            </div>

            <div className="border-app-border overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-app-bg">
                  <tr className="text-app-text-muted text-xs">
                    <th className="px-3 py-2 text-left font-semibold">Metric</th>
                    <th className="px-3 py-2 text-left font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      'Read Bytes Total',
                      bytesFormat(disk.readBytesTotal, {
                        decimalPlaces: 0,
                      }),
                    ],
                    [
                      'Write Bytes Total',
                      bytesFormat(disk.writeBytesTotal, {
                        decimalPlaces: 0,
                      }),
                    ],
                    ['Read Ops Total', prettyNumber(disk.readOpsTotal)],
                    ['Write Ops Total', prettyNumber(disk.writeOpsTotal)],
                  ].map(([metric, value]) => (
                    <tr key={String(metric)} className="border-app-border border-t">
                      <td className="text-app-text-muted px-3 py-2 text-[11px]">{metric}</td>
                      <td className="text-app-text px-3 py-2 text-xs">{prettyValue(value)}</td>
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

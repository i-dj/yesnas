'use client'

import { SideDrawer, StatusPill } from '@/components/ui'
import { bytesFormat, hoursFormat } from '@/lib/utils'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { Activity, HardDrive, Layers3 } from 'lucide-react'
import { displayNumber, displayPercent, displayTemperature, displayValue, toUpperDisplay } from '../utils'
import { StorageDetailList, StorageDetailSection } from './storage-detail-section'
import { StorageSummaryHeader } from './summary/storage-summary-header'

interface DiskDetailDrawerProps {
  disk: DiskModel | null
  storagePools?: StoragePoolModel[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getBytes = (value?: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

const partitionColors = ['bg-cyan-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400', 'bg-lime-400', 'bg-blue-500']

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
            colorClass: partitionColors[index % partitionColors.length],
          }
        })
      : [
          {
            key: disk.path,
            name: `${disk.name}${disk.fsType ? ` · ${disk.fsType}` : ''}${
              disk.mountpoints?.[0] ? ` (${disk.mountpoints[0]})` : ''
            }`,
            sizeText: disk.sizeBytes
              ? bytesFormat(disk.sizeBytes, {
                  decimalPlaces: 2,
                })
              : disk.size || '-',
            bytes: getBytes(disk.sizeBytes),
            colorClass: partitionColors[0],
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
    <SideDrawer open={open} onOpenChange={onOpenChange} title="Disk Details">
      {!disk ? (
        <div className="app-body-text text-app-text-muted">No disk selected.</div>
      ) : (
        <div className="space-y-5">
          <StorageSummaryHeader
            title={disk.model || disk.name}
            subtitle={`SN: ${displayValue(disk.serial)}`}
            icon={HardDrive}
            metrics={[
              {
                label: 'Capacity',
                value:
                  bytesFormat(disk.sizeBytes, {
                    decimalPlaces: 2,
                    standard: 's',
                  }) || '-',
              },
            ]}
          />

          <StorageDetailSection icon={Layers3} title="Partition Layout">
            <div className="bg-app-hover flex h-2 w-full overflow-hidden rounded-full">
              {layoutSegments.map((segment) => {
                const widthPct = Math.max((segment.bytes / layoutTotalBytes) * 100, 0.8)

                return (
                  <span
                    key={segment.key}
                    className={`${segment.colorClass} h-full min-w-0.5`}
                    style={{ width: `${widthPct}%` }}
                    title={`${segment.name} · ${segment.sizeText}`}
                  />
                )
              })}
            </div>

            <div className="divide-app-border/50 mt-1 divide-y">
              {layoutSegments.map((segment) => (
                <div key={segment.key} className="flex min-w-0 items-center gap-2.5 py-1.5">
                  <span className={`${segment.colorClass} size-2.5 shrink-0 rounded-full`} />
                  <span className="app-body-text text-app-text-muted min-w-0 flex-1 truncate">{segment.name}</span>
                  <span className="app-body-text text-app-text shrink-0 font-semibold">{segment.sizeText}</span>
                </div>
              ))}
            </div>
          </StorageDetailSection>

          <StorageDetailSection icon={HardDrive} title="Disk Information">
            <StorageDetailList
              items={[
                { label: 'Model', value: disk.model, fullWidth: true },
                { label: 'Serial Number', value: displayValue(disk.serial), fullWidth: true },
                {
                  label: 'Capacity',
                  value: bytesFormat(disk.sizeBytes, {
                    decimalPlaces: 2,
                    standard: 's',
                  }),
                },
                { label: 'Transport', value: toUpperDisplay(disk.transport) },
                { label: 'Path', value: displayValue(disk.path) },
                {
                  label: 'Storage Pool',
                  value:
                    relatedStoragePools.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {relatedStoragePools.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </span>
                    ) : (
                      'None'
                    ),
                },
              ]}
            />
          </StorageDetailSection>

          <StorageDetailSection icon={Activity} title="SMART & Lifetime Activity">
            <StorageDetailList
              items={[
                { label: 'SMART Available', value: displayValue(disk.smartAvailable) },
                { label: 'SMART Passed', value: displayValue(disk.smartPassed) },
                { label: 'Power On', value: hoursFormat(disk.powerOnHours) },
                { label: 'Power Cycles', value: displayNumber(disk.powerCycleCount) },
                { label: 'Read Total', value: bytesFormat(disk.readBytesTotal, { decimalPlaces: 0 }) },
                { label: 'Write Total', value: bytesFormat(disk.writeBytesTotal, { decimalPlaces: 0 }) },
                { label: 'Read Ops', value: displayNumber(disk.readOpsTotal) },
                { label: 'Write Ops', value: displayNumber(disk.writeOpsTotal) },
                { label: 'Power Losses', value: displayNumber(disk.unsafeShutdownCount) },
                { label: 'Health', value: displayPercent(disk.healthPercent) },
                { label: 'Temperature', value: displayTemperature(disk.temperatureC) },
              ]}
            />
          </StorageDetailSection>
        </div>
      )}
    </SideDrawer>
  )
}

'use client'

import { FormSection, FormSectionPanel, FormSectionTitle, SideDrawer } from '@/components/ui'
import { bytesFormat, hoursFormat } from '@/lib/utils'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { HardDrive } from 'lucide-react'
import type { ReactNode } from 'react'
import { displayNumber, displayPercent, displayTemperature, displayValue, toUpperDisplay } from '../utils'
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

type DetailItem = {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <dl className="grid min-w-0 gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map(({ label, value, fullWidth }) => (
        <div key={label} className={fullWidth ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
          <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-3">
            <dt className="text-app-text-muted text-sm">{label}</dt>
            <dd className="text-app-text min-w-0 text-sm wrap-anywhere">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

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
    <SideDrawer open={open} onOpenChange={onOpenChange} title="磁盘详情">
      {!disk ? (
        <div className="app-body-text text-app-text-muted">未选择磁盘。</div>
      ) : (
        <div>
          <StorageSummaryHeader
            title={disk.model || disk.name}
            subtitle={`SN: ${displayValue(disk.serial)}`}
            icon={HardDrive}
            metrics={[
              {
                label: '容量',
                value:
                  bytesFormat(disk.sizeBytes, {
                    decimalPlaces: 2,
                    standard: 's',
                  }) || '-',
              },
            ]}
          />

          <FormSection className="mt-10">
            <FormSectionTitle>分区布局</FormSectionTitle>
            <FormSectionPanel className="space-y-4">
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

              <div className="divide-app-border divide-y">
                {layoutSegments.map((segment) => (
                  <div key={segment.key} className="flex min-w-0 items-center gap-3 py-2">
                    <span className={`${segment.colorClass} size-2.5 shrink-0 rounded-full`} />
                    <span className="text-app-text-muted min-w-0 flex-1 truncate text-sm">{segment.name}</span>
                    <span className="text-app-text shrink-0 text-sm font-medium">{segment.sizeText}</span>
                  </div>
                ))}
              </div>
            </FormSectionPanel>
          </FormSection>

          <FormSection className="mt-10">
            <FormSectionTitle>磁盘信息</FormSectionTitle>
            <FormSectionPanel>
              <DetailGrid
                items={[
                  { label: '型号', value: disk.model, fullWidth: true },
                  { label: '序列号', value: displayValue(disk.serial), fullWidth: true },
                  {
                    label: '容量',
                    value: bytesFormat(disk.sizeBytes, {
                      decimalPlaces: 2,
                      standard: 's',
                    }),
                  },
                  { label: '传输协议', value: toUpperDisplay(disk.transport) },
                  { label: '路径', value: displayValue(disk.path) },
                  {
                    label: '存储池',
                    value:
                      relatedStoragePools.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {relatedStoragePools.map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </span>
                      ) : (
                        '无'
                      ),
                  },
                ]}
              />
            </FormSectionPanel>
          </FormSection>

          <FormSection className="mt-10">
            <FormSectionTitle>SMART 与寿命</FormSectionTitle>
            <FormSectionPanel>
              <DetailGrid
                items={[
                  { label: 'SMART 可用', value: displayValue(disk.smartAvailable) },
                  { label: 'SMART 通过', value: displayValue(disk.smartPassed) },
                  { label: '通电时间', value: hoursFormat(disk.powerOnHours) },
                  { label: '通电次数', value: displayNumber(disk.powerCycleCount) },
                  { label: '读取总量', value: bytesFormat(disk.readBytesTotal, { decimalPlaces: 2, standard: 'm' }) },
                  { label: '写入总量', value: bytesFormat(disk.writeBytesTotal, { decimalPlaces: 2, standard: 'm' }) },
                  { label: '读取次数', value: displayNumber(disk.readOpsTotal) },
                  { label: '写入次数', value: displayNumber(disk.writeOpsTotal) },
                  { label: '异常断电', value: displayNumber(disk.unsafeShutdownCount) },
                  { label: '健康度', value: displayPercent(disk.healthPercent) },
                  { label: '温度', value: displayTemperature(disk.temperatureC) },
                ]}
              />
            </FormSectionPanel>
          </FormSection>
        </div>
      )}
    </SideDrawer>
  )
}

'use client'

import { CircuitBoard, Gauge, HardDrive, Network } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { EmptyState } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import type { HardwareSnapshot } from '@/types'
import { formatOptional } from '../utils'
import { CpuDetailCard } from './cpu-detail-card'
import { DeviceGrid } from './device-panel'
import { DiskPanel, DiskSummary } from './disk-panel'
import { HardwareInfoCard } from './hardware-info-cards'
import { HardwareSection } from './hardware-section'
import { MemoryDetailCard } from './memory-detail-card'
import { NetworkPanel, NetworkSummary } from './network-panel'

export function HardwareDetails({ snapshot }: { snapshot: HardwareSnapshot }) {
  const t = useTranslations('Hardware')
  const gpu = snapshot.gpus[0]
  const cpus = snapshot.cpus?.length ? snapshot.cpus : [snapshot.cpu]

  return (
    <>
      <section className="grid gap-2 xl:grid-cols-2">
        <HardwareInfoCard
          icon={CircuitBoard}
          accentClassName="text-violet-400"
          title={t('sections.motherboard')}
          subtitle={[snapshot.motherboard.manufacturer, snapshot.motherboard.product].filter(Boolean).join(' · ')}
          details={[
            [t('fields.manufacturer'), snapshot.motherboard.manufacturer || '-', true],
            [t('fields.productModel'), snapshot.motherboard.product || '-', true],
            [t('fields.version'), snapshot.motherboard.version || '-', false],
            [t('fields.serial'), snapshot.motherboard.serial || '-', false],
          ]}
        />
        <HardwareInfoCard
          icon={Gauge}
          accentClassName="text-violet-400"
          title={t('sections.gpus')}
          subtitle={gpu?.name || t('empty.gpus')}
          details={
            gpu
              ? [
                  [t('fields.vendor'), gpu.vendor || '-', true],
                  [t('fields.usageRate'), formatOptional(gpu.usagePercent, '%'), false],
                  [
                    t('fields.videoMemoryTemperature'),
                    `${gpu.memoryTotalBytes > 0 ? `${formatBytes(gpu.memoryUsedBytes)} / ${formatBytes(gpu.memoryTotalBytes)}` : '-'} · ${formatOptional(gpu.temperatureC, ' °C')}`,
                    true,
                  ],
                  [t('fields.power'), formatOptional(gpu.powerW, ' W'), false],
                ]
              : []
          }
        />
      </section>

      <section className="grid gap-2 xl:grid-cols-2">
        <CpuDetailCard cpus={cpus} />
        <MemoryDetailCard memory={snapshot.memory} />
      </section>

      <section className="space-y-2">
        <HardwareSection
          icon={HardDrive}
          className="border-b-0"
          title={t('sections.disks')}
          summaryAlign="end"
          summary={snapshot.disks.length ? <DiskSummary disks={snapshot.disks} /> : undefined}
        >
          {snapshot.disks.length ? (
            <DeviceGrid
              items={snapshot.disks}
              getKey={(disk) => disk.path}
              renderItem={(disk) => <DiskPanel disk={disk} />}
            />
          ) : (
            <EmptyState message={t('empty.disks')} className="border-none bg-transparent py-6" />
          )}
        </HardwareSection>

        <HardwareSection
          icon={Network}
          className="border-b-0"
          title={t('sections.network')}
          summaryAlign="end"
          summary={
            snapshot.networkInterfaces.length ? (
              <NetworkSummary networkInterfaces={snapshot.networkInterfaces} />
            ) : undefined
          }
        >
          {snapshot.networkInterfaces.length ? (
            <DeviceGrid
              items={snapshot.networkInterfaces}
              getKey={(networkInterface) => networkInterface.name}
              renderItem={(networkInterface) => <NetworkPanel networkInterface={networkInterface} />}
            />
          ) : (
            <EmptyState message={t('empty.network')} className="border-none bg-transparent py-6" />
          )}
        </HardwareSection>
      </section>
    </>
  )
}

'use client'

import { CircuitBoard, Cpu, Gauge, HardDrive, Network } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { EmptyState } from '@/components/ui'
import { formatBytes, formatPercent } from '@/lib/utils'
import type { HardwareSnapshot } from '@/types'
import { formatOptional } from '../utils'
import { DeviceGrid } from './device-panel'
import { DiskPanel, DiskSummary } from './disk-panel'
import { HardwareInfoCard, ResourceDetailCard } from './hardware-info-cards'
import { HardwareSection } from './hardware-section'
import { MemoryDetailCard } from './memory-detail-card'
import { NetworkPanel, NetworkSummary } from './network-panel'

export function HardwareDetails({ snapshot }: { snapshot: HardwareSnapshot }) {
  const t = useTranslations('Hardware')
  const gpu = snapshot.gpus[0]

  return (
    <>
      <section className="grid gap-2 xl:grid-cols-2">
        <HardwareInfoCard
          icon={CircuitBoard}
          accentClassName="bg-violet-500/10 text-violet-400"
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
          accentClassName="bg-violet-500/10 text-violet-400"
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
        <ResourceDetailCard
          icon={Cpu}
          title={t('sections.cpu')}
          subtitle={snapshot.cpu.model}
          value={formatPercent(snapshot.cpu.usagePercent)}
          percent={snapshot.cpu.usagePercent}
          color="#38bdf8"
          details={[
            [t('fields.coresThreads'), `${snapshot.cpu.cores} / ${snapshot.cpu.threads}`, false],
            [t('fields.frequency'), `${snapshot.cpu.frequencyGhz.toFixed(2)} GHz`, false],
            [t('fields.temperature'), formatOptional(snapshot.cpu.temperatureC, ' °C'), false],
            [t('fields.fanSpeed'), formatOptional(snapshot.cpu.fanRpm, ' RPM'), false],
            [t('fields.power'), formatOptional(snapshot.cpu.powerW, ' W'), false],
          ]}
        />
        <MemoryDetailCard memory={snapshot.memory} />
      </section>

      <section className="space-y-2">
        <HardwareSection
          icon={HardDrive}
          title={t('sections.disks')}
          subtitle={t('counts.disks', { count: snapshot.disks.length })}
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
          title={t('sections.network')}
          subtitle={t('counts.network', { count: snapshot.networkInterfaces.length })}
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

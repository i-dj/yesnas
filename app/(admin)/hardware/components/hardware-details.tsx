'use client'

import { HardDrive, Network } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { EmptyState } from '@/components/ui'
import type { HardwareSnapshot } from '@/types'
import { CpuDetailCard } from './cpu-detail-card'
import { DeviceGrid } from './device-panel'
import { DiskPanel, DiskSummary } from './disk-panel'
import { HardwareSection } from './hardware-section'
import { MemoryDetailCard } from './memory-detail-card'
import { NetworkPanel, NetworkSummary } from './network-panel'

export function HardwareDetails({ snapshot }: { snapshot: HardwareSnapshot }) {
  const t = useTranslations('Hardware')
  const cpus = snapshot.cpus?.length ? snapshot.cpus : [snapshot.cpu]

  return (
    <>
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

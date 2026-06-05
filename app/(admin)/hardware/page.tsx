'use client'

import {
  Activity,
  CircuitBoard,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  MemoryStick,
  MonitorCog,
  Network,
  Server,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Card, StatusPill } from '@/components/ui'
import { getSystemHardwareStreamUrl } from '@/lib/file-api'
import { formatBytes, formatDateTime, formatPercent } from '@/lib/utils'
import type { HardwareDisk, HardwareGpu, HardwareNetworkInterface, HardwareSnapshot } from '@/types'
import { useTranslations } from 'next-intl'

type StreamState = 'connecting' | 'ready' | 'error'

export default function HardwarePage() {
  const t = useTranslations('Hardware')
  const [snapshot, setSnapshot] = useState<HardwareSnapshot | null>(null)
  const [streamState, setStreamState] = useState<StreamState>('connecting')

  useEffect(() => {
    let disposed = false
    const source = new EventSource(getSystemHardwareStreamUrl(1))

    const updateSnapshot = (event: MessageEvent<string>) => {
      try {
        const nextSnapshot = JSON.parse(event.data) as HardwareSnapshot
        if (!disposed) {
          setSnapshot(nextSnapshot)
          setStreamState('ready')
        }
      } catch {
        if (!disposed) setStreamState('error')
      }
    }

    source.addEventListener('ready', () => {
      if (!disposed) setStreamState('ready')
    })
    source.addEventListener('hardware-status', updateSnapshot)
    source.addEventListener('hardware', updateSnapshot)
    source.addEventListener('hardware-info', updateSnapshot)
    source.addEventListener('system-hardware', updateSnapshot)
    source.onmessage = updateSnapshot
    source.onerror = () => {
      if (!disposed) setStreamState('error')
    }

    return () => {
      disposed = true
      source.close()
    }
  }, [])

  const summaryItems = useMemo(
    () => [
      {
        label: t('summary.deviceName'),
        value: snapshot?.system.deviceName || snapshot?.system.hostname || '-',
        icon: Server,
      },
      { label: t('summary.os'), value: snapshot?.system.osVersion || '-', icon: MonitorCog },
      { label: t('summary.kernel'), value: snapshot?.system.kernelVersion || '-', icon: CircuitBoard },
      {
        label: t('summary.uptime'),
        value: snapshot ? formatHardwareUptime(snapshot.system.uptimeSeconds, t) : '-',
        icon: Activity,
      },
    ],
    [snapshot, t],
  )

  return (
    <PageWrapper className="-mx-8 gap-3 overflow-y-auto px-8 pb-8">
      <section className="flex shrink-0 flex-col gap-2 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-app-text flex items-center gap-2 text-xl font-semibold">
            <CircuitBoard className="size-5 text-sky-400" />
            {t('title')}
            <StatusPill
              color={streamState === 'error' ? 'danger' : streamState === 'ready' ? 'success' : 'neutral'}
              content={
                streamState === 'error'
                  ? t('stream.error')
                  : streamState === 'ready'
                    ? t('stream.live')
                    : t('stream.connecting')
              }
            />
          </div>
          <p className="text-app-text-muted mt-0.5 text-xs">{t('subtitle')}</p>
        </div>
        <p className="text-app-text-muted text-xs">
          {t('lastUpdated', { value: snapshot ? formatDateTime(snapshot.checkedAt) : '--' })}
        </p>
      </section>

      <section className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <Card key={item.label} className="p-2.5">
            <div className="flex items-start gap-2.5">
              <span className="bg-app-hover grid size-8 shrink-0 place-items-center rounded-md">
                <item.icon className="text-app-text-muted size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-app-text-muted text-[10px]">{item.label}</p>
                <p className="text-app-text mt-0.5 text-xs font-semibold break-words" title={item.value}>
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {!snapshot ? (
        <div className="text-app-text-muted border-app-border grid min-h-72 place-items-center rounded-lg border border-dashed text-sm">
          {streamState === 'error' ? t('stream.loadError') : t('stream.loading')}
        </div>
      ) : (
        <div className="border-app-border divide-app-border/65 mt-1 divide-y border-t pt-1">
          <HardwareDetailSection icon={Cpu} title={t('sections.cpu')} subtitle={snapshot.cpu.model}>
            <DetailGrid
              items={[
                [t('fields.cpuUsage'), formatPercent(snapshot.cpu.usagePercent)],
                [t('fields.coresThreads'), `${snapshot.cpu.cores} / ${snapshot.cpu.threads}`],
                [t('fields.frequency'), `${snapshot.cpu.frequencyGhz.toFixed(2)} GHz`],
                [t('fields.temperature'), formatOptional(snapshot.cpu.temperatureC, ' °C')],
                [t('fields.fanSpeed'), formatOptional(snapshot.cpu.fanRpm, ' RPM')],
                [t('fields.power'), formatOptional(snapshot.cpu.powerW, ' W')],
              ]}
            />
          </HardwareDetailSection>

          <HardwareDetailSection
            icon={CircuitBoard}
            title={t('sections.motherboard')}
            subtitle={[snapshot.motherboard.manufacturer, snapshot.motherboard.product].filter(Boolean).join(' · ')}
          >
            <DetailGrid
              items={[
                [t('fields.manufacturer'), snapshot.motherboard.manufacturer || '-'],
                [t('fields.productModel'), snapshot.motherboard.product || '-'],
                [t('fields.version'), snapshot.motherboard.version || '-'],
                [t('fields.serial'), snapshot.motherboard.serial || '-'],
              ]}
            />
          </HardwareDetailSection>

          <HardwareDetailSection
            icon={MemoryStick}
            title={t('sections.memory')}
            subtitle={`${formatBytes(snapshot.memory.totalBytes)} · ${snapshot.memory.type} · ${snapshot.memory.speedMHz} MHz`}
          >
            <DetailGrid
              items={[
                [t('fields.totalCapacity'), formatBytes(snapshot.memory.totalBytes)],
                [t('fields.memoryUsage'), formatPercent(snapshot.memory.usagePercent)],
                [t('fields.used'), formatBytes(snapshot.memory.usedBytes)],
                [t('fields.available'), formatBytes(snapshot.memory.availableBytes)],
                [t('fields.pressure'), formatPercent(snapshot.memory.pressurePercent)],
                [t('fields.typeSpeed'), `${snapshot.memory.type || '-'} / ${snapshot.memory.speedMHz || '-'} MHz`],
                [t('fields.manufacturer'), snapshot.memory.manufacturer || '-'],
                [t('fields.partNumber'), snapshot.memory.partNumber || '-'],
              ]}
            />
          </HardwareDetailSection>

          <HardwareDetailSection
            icon={HardDrive}
            title={t('sections.disks')}
            subtitle={t('counts.disks', { count: snapshot.disks.length })}
          >
            {snapshot.disks.length ? (
              <div>
                {snapshot.disks.map((disk) => (
                  <DiskRow key={disk.path} disk={disk} />
                ))}
              </div>
            ) : (
              <EmptyText>{t('empty.disks')}</EmptyText>
            )}
          </HardwareDetailSection>

          <HardwareDetailSection
            icon={Gauge}
            title={t('sections.gpus')}
            subtitle={t('counts.gpus', { count: snapshot.gpus.length })}
          >
            {snapshot.gpus.length ? (
              <div>
                {snapshot.gpus.map((gpu) => (
                  <GpuRow key={`${gpu.vendor}-${gpu.name}`} gpu={gpu} />
                ))}
              </div>
            ) : (
              <EmptyText>{t('empty.gpus')}</EmptyText>
            )}
          </HardwareDetailSection>

          <HardwareDetailSection
            icon={Network}
            title={t('sections.network')}
            subtitle={t('counts.network', { count: snapshot.networkInterfaces.length })}
          >
            {snapshot.networkInterfaces.length ? (
              <div>
                {snapshot.networkInterfaces.map((networkInterface) => (
                  <NetworkRow key={networkInterface.name} networkInterface={networkInterface} />
                ))}
              </div>
            ) : (
              <EmptyText>{t('empty.network')}</EmptyText>
            )}
          </HardwareDetailSection>
        </div>
      )}
    </PageWrapper>
  )
}

function HardwareDetailSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Cpu
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0 py-4">
      <div className="mb-3 flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-400">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-app-text text-sm font-semibold">{title}</h2>
          <p className="text-app-text-muted mt-0.5 text-[11px] leading-4 break-words">{subtitle || '-'}</p>
        </div>
      </div>
      <div className="min-w-0 sm:pl-10">{children}</div>
    </section>
  )
}

function DiskRow({ disk }: { disk: HardwareDisk }) {
  const t = useTranslations('Hardware')
  const passed = disk.health.toLowerCase() === 'passed' || disk.health.toLowerCase() === 'healthy'

  return (
    <div className="border-app-border/60 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <RowIdentity
          icon={Database}
          title={disk.model || disk.name}
          subtitle={`${disk.path} · ${formatBytes(disk.sizeBytes)}`}
        />
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
          <StatusPill
            color={passed ? 'success' : 'warning'}
            content={passed ? t('statuses.passed') : disk.health || t('statuses.unknown')}
          />
          <StatusPill
            color={disk.inUse ? 'success' : 'neutral'}
            content={disk.inUse ? t('statuses.inUse') : t('statuses.unused')}
          />
          {disk.transport ? <StatusPill color="neutral" content={disk.transport.toUpperCase()} /> : null}
        </div>
      </div>
      <DetailGrid
        items={[
          [t('fields.devicePath'), disk.path || '-'],
          [t('fields.serial'), disk.serial || '-'],
          [t('fields.vendor'), disk.vendor || '-'],
          [t('fields.capacity'), formatBytes(disk.sizeBytes)],
          [t('fields.usage'), formatDiskUsage(disk.usage, t)],
          [t('fields.temperature'), formatOptional(disk.temperatureC, ' °C')],
          [
            'SMART',
            disk.smartAvailable
              ? disk.smartPassed
                ? t('statuses.passed')
                : t('statuses.abnormal')
              : t('statuses.unsupported'),
          ],
          [
            t('fields.powerOnTime'),
            disk.powerOnHours === undefined ? '-' : t('values.hours', { value: disk.powerOnHours }),
          ],
          [t('fields.powerCycles'), disk.powerCycleCount === undefined ? '-' : String(disk.powerCycleCount)],
          [
            t('fields.realtimeIo'),
            t('values.readWrite', {
              read: formatSpeed(disk.readBytesPerSec),
              write: formatSpeed(disk.writeBytesPerSec),
            }),
          ],
        ]}
      />
    </div>
  )
}

function GpuRow({ gpu }: { gpu: HardwareGpu }) {
  const t = useTranslations('Hardware')
  return (
    <div className="border-app-border/60 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-3">
        <RowIdentity icon={Gauge} title={gpu.name} subtitle={gpu.vendor || t('statuses.unknownVendor')} />
      </div>
      <DetailGrid
        items={[
          [t('fields.vendor'), gpu.vendor || '-'],
          [t('fields.usageRate'), formatOptional(gpu.usagePercent, '%')],
          [t('fields.temperature'), formatOptional(gpu.temperatureC, ' °C')],
          [
            t('fields.videoMemory'),
            gpu.memoryTotalBytes > 0
              ? `${formatBytes(gpu.memoryUsedBytes)} / ${formatBytes(gpu.memoryTotalBytes)}`
              : '-',
          ],
          [t('fields.power'), formatOptional(gpu.powerW, ' W')],
        ]}
      />
    </div>
  )
}

function NetworkRow({ networkInterface }: { networkInterface: HardwareNetworkInterface }) {
  const t = useTranslations('Hardware')
  const online = networkInterface.operState.toLowerCase() === 'up'

  return (
    <div className="border-app-border/60 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-3">
        <RowIdentity
          icon={Network}
          title={networkInterface.name}
          subtitle={networkInterface.ips.join(' · ') || networkInterface.mac || t('statuses.noIp')}
          status={
            <StatusPill
              color={online ? 'success' : 'neutral'}
              content={online ? t('statuses.online') : t('statuses.offline')}
            />
          }
        />
      </div>
      <DetailGrid
        items={[
          [t('fields.macAddress'), networkInterface.mac || '-'],
          [t('fields.ipAddress'), networkInterface.ips.join(' · ') || '-'],
          [t('fields.connectionStatus'), online ? t('statuses.online') : t('statuses.offline')],
          ['MTU', String(networkInterface.mtu || '-')],
          [t('fields.receiveSpeed'), formatSpeed(networkInterface.speed.rxBytesPerSec)],
          [t('fields.sendSpeed'), formatSpeed(networkInterface.speed.txBytesPerSec)],
        ]}
      />
    </div>
  )
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <LabeledValue key={label} label={label} value={value} />
      ))}
    </dl>
  )
}

function RowIdentity({
  icon: Icon,
  title,
  subtitle,
  status,
}: {
  icon: typeof Database
  title: string
  subtitle: string
  status?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="bg-app-hover grid size-8 shrink-0 place-items-center rounded-md">
        <Icon className="text-app-text-muted size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-app-text text-xs font-semibold break-words">{title || '-'}</p>
          {status}
        </div>
        <p className="text-app-text-muted mt-0.5 text-[11px] [overflow-wrap:anywhere] break-words" title={subtitle}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function LabeledValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-app-text-muted text-[11px]">{label}</dt>
      <dd className="text-app-text mt-1 min-w-0 text-xs leading-5 font-medium [overflow-wrap:anywhere] break-words">
        {value ?? '-'}
      </dd>
    </div>
  )
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div className="text-app-text-muted py-6 text-center text-xs">{children}</div>
}

function formatOptional(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}${suffix}`
}

function formatSpeed(bytesPerSecond: number) {
  return `${formatBytes(bytesPerSecond)}/s`
}

function formatHardwareUptime(seconds: number, t: (key: string, values?: Record<string, number>) => string) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return days > 0 ? t('values.daysHours', { days, hours }) : t('values.hours', { value: hours })
}

function formatDiskUsage(usage: string | undefined, t: (key: string) => string) {
  if (usage === 'system') return t('diskUsage.system')
  if (usage === 'storage_pool') return t('diskUsage.storagePool')
  if (usage === 'mixed') return t('diskUsage.mixed')
  if (usage === 'unused') return t('statuses.unused')
  return usage || '-'
}

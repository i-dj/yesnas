'use client'

import { ArrowDownToLine, ArrowUpFromLine, Network } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { StatusPill } from '@/components/ui'
import type { HardwareNetworkInterface } from '@/types'
import { formatSpeed } from '../utils'
import { DetailContent, DetailValue, DevicePanel } from './device-panel'
import { SummaryMetrics } from './hardware-section'

export function NetworkPanel({ networkInterface }: { networkInterface: HardwareNetworkInterface }) {
  const t = useTranslations('Hardware')
  const online = networkInterface.operState?.toLowerCase() === 'up'
  const ips = networkInterface.ips ?? []
  const ipAddresses = ips.join(' · ') || '-'

  return (
    <DevicePanel
      icon={Network}
      title={networkInterface.name}
      subtitle={networkInterface.mac || '-'}
      status={
        <StatusPill
          color={online ? 'success' : 'neutral'}
          content={online ? t('statuses.online') : t('statuses.offline')}
        />
      }
    >
      <div className="grid min-w-0 gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,2fr)_minmax(7rem,0.75fr)]">
        <DetailContent label={t('fields.ipAddress')}>
          <span className="grid min-h-9 min-w-0 flex-1 content-start leading-[1.125rem]" title={ipAddresses}>
            {ips.length ? (
              ips.slice(0, 2).map((ip) => (
                <span key={ip} className="block min-w-0 truncate">
                  {ip}
                </span>
              ))
            ) : (
              <span>-</span>
            )}
          </span>
        </DetailContent>
        <DetailValue label="MTU" value={String(networkInterface.mtu || '-')} />
        <DetailContent label={t('fields.receiveSendSpeed')}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <ArrowDownToLine className="size-3 text-sky-400" />
            {formatSpeed(networkInterface.speed?.rxBytesPerSec)}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <ArrowUpFromLine className="size-3 text-violet-400" />
            {formatSpeed(networkInterface.speed?.txBytesPerSec)}
          </span>
        </DetailContent>
      </div>
    </DevicePanel>
  )
}

export function NetworkSummary({ networkInterfaces }: { networkInterfaces: HardwareNetworkInterface[] }) {
  const t = useTranslations('Hardware')
  const onlineCount = networkInterfaces.filter((item) => item.operState?.toLowerCase() === 'up').length
  const totalRx = networkInterfaces.reduce((total, item) => total + (item.speed?.rxBytesPerSec ?? 0), 0)
  const totalTx = networkInterfaces.reduce((total, item) => total + (item.speed?.txBytesPerSec ?? 0), 0)

  return (
    <SummaryMetrics
      items={[
        { label: t('overview.onlineInterfaces'), value: `${onlineCount}/${networkInterfaces.length}` },
        { label: t('fields.receiveSpeed'), value: formatSpeed(totalRx) },
        { label: t('fields.sendSpeed'), value: formatSpeed(totalTx) },
      ]}
    />
  )
}

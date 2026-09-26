'use client'

import { ArrowDownToLine, ArrowUpFromLine, Network } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { StatusPill, Tooltip } from '@/components/ui'
import type { HardwareNetworkInterface } from '@/types'
import { formatNetworkSpeed } from '../utils'
import { HardwareMetrics } from './hardware-section'
import { DetailContent, DetailValue, DevicePanel } from './device-panel'

export function NetworkPanel({ networkInterface }: { networkInterface: HardwareNetworkInterface }) {
  const t = useTranslations('Hardware')
  const online = networkInterface.operState?.toLowerCase() === 'up'
  const ips = networkInterface.ips ?? []

  return (
    <DevicePanel
      icon={Network}
      title={networkInterface.name}
      status={
        <StatusPill
          color={online ? 'success' : 'neutral'}
          content={online ? t('statuses.online') : t('statuses.offline')}
        />
      }
    >
      <div className="grid min-w-0 gap-x-6 gap-y-2.5">
        <DetailContent label={t('fields.ipAddress')}>
          <span className="grid min-h-9 min-w-0 flex-1 content-start leading-5">
            {ips.length ? (
              ips.slice(0, 2).map((ip) => (
                <Tooltip content={ip} key={ip} triggerClassName="block min-w-0 truncate">
                  {ip}
                </Tooltip>
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
            {formatNetworkSpeed(networkInterface.speed?.rxBytesPerSec)}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <ArrowUpFromLine className="size-3 text-violet-400" />
            {formatNetworkSpeed(networkInterface.speed?.txBytesPerSec)}
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
    <HardwareMetrics
      items={[
        { label: t('overview.onlineInterfaces'), value: `${onlineCount}/${networkInterfaces.length}` },
        { label: t('fields.receiveSpeed'), value: formatNetworkSpeed(totalRx) },
        { label: t('fields.sendSpeed'), value: formatNetworkSpeed(totalTx) },
      ]}
    />
  )
}

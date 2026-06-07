'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatBytes } from '@/lib/utils'
import type { NetworkRange } from '../types'
import { formatChartTime, formatInterfaceName, formatSpeed } from '../utils'
import { NetworkInterfaceSnapshot } from '@/types/models/dashboard'

export function NetworkChart({ interfaces, range }: { interfaces: NetworkInterfaceSnapshot[]; range: NetworkRange }) {
  const isRealtime = range === 'realtime'
  const points = buildNetworkThroughputPoints(interfaces, range)
  const interfaceLabel = interfaces.length === 1 ? formatInterfaceName(interfaces[0]) : '全部网卡'
  const interfaceMeta =
    interfaces.length === 1 ? `${interfaces[0].ips[0] ?? '无 IP'}` : `聚合 ${interfaces.length} 个网卡`

  return (
    <div className="border-app-border bg-app-bg mt-3 rounded-lg border px-1 py-2.5">
      <div className="h-56 select-none">
        {points.length === 0 ? (
          <div className="text-app-text-muted grid h-full place-items-center text-xs">等待网络监控接口数据</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 14, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.22)" strokeDasharray="4 8" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                minTickGap={20}
              />
              <YAxis
                width={86}
                tick={<NetworkYAxisTick formatter={isRealtime ? formatSpeed : formatBytes} />}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(148, 163, 184, 0.55)', strokeWidth: 1 }}
                content={
                  <NetworkChartTooltip
                    interfaceLabel={interfaceLabel}
                    interfaceMeta={interfaceMeta}
                    isRealtime={isRealtime}
                  />
                }
              />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="plainline"
                formatter={(value) => <span className="text-app-text-muted text-[10px]">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="rxValue"
                name="接收"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="txValue"
                name="发送"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function NetworkYAxisTick({
  x = 0,
  y = 0,
  payload,
  formatter,
}: {
  x?: number
  y?: number
  payload?: { value?: number }
  formatter: (value: number) => string
}) {
  return (
    <text x={x - 8} y={y} dy="0.32em" fill="#a1a1aa" fontSize={11} textAnchor="end" style={{ whiteSpace: 'nowrap' }}>
      {formatter(payload?.value ?? 0)}
    </text>
  )
}

function NetworkChartTooltip({
  active,
  payload,
  interfaceLabel,
  interfaceMeta,
  isRealtime,
}: {
  active?: boolean
  payload?: Array<{
    color?: string
    name?: string
    value?: number
    payload?: {
      timestamp?: string
      startTime?: string
      endTime?: string
      durationSeconds?: number
    }
  }>
  interfaceLabel: string
  interfaceMeta: string
  isRealtime: boolean
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload

  return (
    <div className="border-app-border bg-app-surface/95 min-w-44 rounded-lg border px-3 py-2 text-xs shadow-xl">
      <div className="text-app-text font-semibold">{interfaceLabel}</div>
      <div className="text-app-text-muted mt-1">{interfaceMeta}</div>
      <div className="text-app-text-muted mt-1">{formatNetworkPointTime(point)}</div>
      <div className="mt-2 grid gap-1">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-5">
            <span className="text-app-text-muted">{isRealtime ? `${item.name}速度` : `${item.name}流量`}</span>
            <span className="font-semibold" style={{ color: item.color }}>
              {isRealtime ? formatSpeed(item.value ?? 0) : formatBytes(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildNetworkThroughputPoints(interfaces: NetworkInterfaceSnapshot[], range: NetworkRange) {
  const pointCount = Math.max(0, ...interfaces.map((item) => getInterfacePoints(item).length))
  const isRealtime = range === 'realtime'

  return Array.from({ length: pointCount }, (_, index) => {
    let rxBytes = 0
    let txBytes = 0
    let rxBytesPerSec = 0
    let txBytesPerSec = 0
    const samplePoint = interfaces.map((item) => getInterfacePoints(item)[index]).find(Boolean)
    const timestamp = samplePoint?.timestamp ?? new Date().toISOString()

    interfaces.forEach((networkInterface) => {
      const point = getInterfacePoints(networkInterface)[index]
      rxBytes += point?.rxBytes ?? 0
      txBytes += point?.txBytes ?? 0
      rxBytesPerSec += point?.rxBytesPerSec ?? 0
      txBytesPerSec += point?.txBytesPerSec ?? 0
    })

    return {
      timestamp,
      startTime: samplePoint?.startTime,
      endTime: samplePoint?.endTime,
      durationSeconds: samplePoint?.durationSeconds,
      label: formatNetworkTick(timestamp, index, pointCount, range),
      rxValue: isRealtime ? rxBytesPerSec : rxBytes,
      txValue: isRealtime ? txBytesPerSec : txBytes,
    }
  })
}

function getInterfacePoints(networkInterface: NetworkInterfaceSnapshot) {
  if (networkInterface.points?.length) return networkInterface.points

  return [
    {
      timestamp: new Date().toISOString(),
      rxBytesPerSec: networkInterface.speed.rxBytesPerSec,
      txBytesPerSec: networkInterface.speed.txBytesPerSec,
    },
  ]
}

function formatNetworkTick(timestamp: string, index: number, pointCount: number, range: NetworkRange) {
  if (range === 'realtime') {
    const secondsAgo = pointCount - 1 - index
    return secondsAgo === 0 ? 'now' : `-${secondsAgo}s`
  }

  return formatChartTime(timestamp)
}

function formatNetworkPointTime(point?: {
  timestamp?: string
  startTime?: string
  endTime?: string
  durationSeconds?: number
}) {
  if (!point) return ''
  if (point.startTime || point.endTime) {
    return [formatChartTime(point.startTime ?? point.timestamp), formatChartTime(point.endTime)]
      .filter(Boolean)
      .join(' - ')
  }

  if (!point.timestamp || !point.durationSeconds) return formatChartTime(point.timestamp)

  const start = new Date(point.timestamp)
  if (Number.isNaN(start.getTime())) return formatChartTime(point.timestamp)

  const end = new Date(start.getTime() + point.durationSeconds * 1000)
  return `${formatChartTime(point.timestamp)} - ${formatChartTime(end.toISOString())}`
}

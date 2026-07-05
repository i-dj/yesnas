'use client'

import { MetricStat, Progress } from '@/components/ui'
import { bytesFormat, calculateUsedPercent, cn, formatUsagePercent, getProgressColorClass } from '@/lib/utils'
import type { ComponentType, ReactNode } from 'react'

export type StorageSummaryMetric = {
  label: string
  value: string
}

interface StorageSummaryHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ComponentType<{ className?: string }>
  iconSrc?: string
  iconAlt?: string
  metrics?: StorageSummaryMetric[]
  usedBytes?: number | null
  totalBytes?: number | null
  usagePercent?: number | null
  pathLabel?: ReactNode
  className?: string
  iconClassName?: string
}

export function StorageSummaryHeader({
  title,
  subtitle,
  icon: Icon,
  iconSrc,
  iconAlt = '',
  metrics,
  usedBytes,
  totalBytes,
  usagePercent,
  pathLabel,
  className,
  iconClassName,
}: StorageSummaryHeaderProps) {
  const normalizedUsedBytes = usedBytes ?? 0
  const normalizedTotalBytes = totalBytes ?? 0
  const hasUsage = normalizedTotalBytes > 0 && usedBytes !== undefined && usedBytes !== null
  const usedPercent = calculateUsedPercent(normalizedUsedBytes, normalizedTotalBytes)

  return (
    <section className={cn('border-app-border space-y-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {iconSrc ? (
            <span className="border-app-border-strong bg-app-bg flex size-12 shrink-0 items-center justify-center rounded-full border p-2.5">
              <img src={iconSrc} alt={iconAlt} className="size-full object-contain" />
            </span>
          ) : Icon ? (
            <span className="border-app-border-strong bg-app-bg flex size-12 shrink-0 items-center justify-center rounded-full border">
              <Icon className={cn('text-app-text-muted size-6', iconClassName)} />
            </span>
          ) : null}

          <div className="min-w-0">
            <h2 className="text-app-text truncate text-base leading-tight font-semibold">{title}</h2>
            {subtitle ? <div className="text-app-text-muted mt-1 truncate text-[13px]">{subtitle}</div> : null}
          </div>
        </div>

        {metrics?.length ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {metrics.map((metric) => (
              <MetricStat key={metric.label} label={metric.label} className="bg-app-surface" value={metric.value} />
            ))}
          </div>
        ) : null}
      </div>

      {hasUsage ? (
        <div className="space-y-1">
          <Progress value={usedPercent} showLabel={false} className={getProgressColorClass(usedPercent)} />
          <div className="text-app-text-muted flex items-center justify-between gap-3 text-[13px]">
            <span className="inline-flex min-w-0 items-center gap-1">
              <span>
                {bytesFormat(normalizedUsedBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                })}
              </span>
              <span>/</span>
              <span>
                {bytesFormat(normalizedTotalBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                })}
              </span>
              {pathLabel ? <span className="truncate">({pathLabel})</span> : null}
            </span>
            <span className="shrink-0">
              {formatUsagePercent(normalizedUsedBytes, normalizedTotalBytes, usagePercent ?? usedPercent)}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  )
}

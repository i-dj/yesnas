'use client'

import { formatDateTime, formatSmartTimeInfo, getTimestamp, parseApiDate } from '@/lib/utils'
import { useMemo } from 'react'

import { Tooltip } from './tooltip'

type RelativeTimeMode = 'smart' | 'timestamp'

interface RelativeTimeProps {
  value: Date | string | number | null | undefined
  locale?: string
  timeZone?: string
  className?: string
  mode?: RelativeTimeMode
  tooltip?: boolean
  triggerClassName?: string
  now?: Date | string | number | null
}

export function RelativeTime({
  value,
  locale = 'en',
  timeZone,
  className,
  mode = 'smart',
  tooltip = true,
  triggerClassName = 'w-fit',
  now,
}: RelativeTimeProps) {
  const fullText = useMemo(() => formatDateTime(value, timeZone), [timeZone, value])
  const text = useMemo(() => {
    if (mode === 'timestamp') return getTimestamp(parseApiDate(value), locale, timeZone, now ?? undefined)
    return formatSmartTimeInfo(value, timeZone, locale, now ?? undefined).text
  }, [locale, mode, now, timeZone, value])

  const content = tooltip && fullText !== '--' ? fullText : null
  const element = <span className={className}>{text}</span>

  if (!content) return element

  return (
    <Tooltip content={content} triggerClassName={triggerClassName}>
      {element}
    </Tooltip>
  )
}

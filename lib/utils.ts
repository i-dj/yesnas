import { SORT_DIRECTIONS, SortDirection } from '@/types'
import { type ClassValue, clsx } from 'clsx'
import { nanoid } from 'nanoid'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names using `clsx` and resolves conflicts with `tailwind-merge`.
 * @param inputs List of class names to merge.
 * @returns Merged class name string.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs))
}
/**
 * Sorts an array of objects by a specific field.
 * @param data The array of objects to be sorted.
 * @param field The field to sort by.
 * @param direction The sorting direction ('asc' or 'desc').
 */
/**
 * Natural sort helper.
 * Order: symbols > numbers > Latin letters > Chinese characters.
 */
export function performSort<T>(data: T[], key: keyof T, direction: SortDirection): T[] {
  if (!direction) {
    return [...data]
  }

  const getPriority = (value: unknown): number => {
    const str = String(value || '').trim()
    if (!str) return 99

    const char = str.charAt(0)

    // Priority 0: symbols (#, @, _, etc.)
    // Priority 1: numbers (0-9)
    // Priority 2: Latin letters (A-Z, a-z)
    // Priority 3: Chinese characters
    if (/[0-9]/.test(char)) return 1
    if (/[a-zA-Z]/.test(char)) return 2
    if (/[\u4e00-\u9fa5]/.test(char)) return 3

    return 0
  }

  return [...data].sort((a, b) => {
    const valA = a[key]
    const valB = b[key]

    if (valA === valB) return 0
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (typeof valA === 'string' && typeof valB === 'string') {
      const prioA = getPriority(valA)
      const prioB = getPriority(valB)

      if (prioA !== prioB) {
        return prioA - prioB
      }

      const result = valA.localeCompare(valB, 'zh-CN', {
        numeric: true, // Compare numeric fragments naturally ("2" < "10")
        sensitivity: 'accent',
      })

      return direction === SORT_DIRECTIONS.ASC ? result : -result
    }

    const result = valA > valB ? 1 : -1
    return direction === SORT_DIRECTIONS.ASC ? result : -result
  })
}
/**
 * Converts a Date object into a human-readable relative time string.
 * @param createdAt The date to compare against the current time.
 * @param locale Locale used to format the relative time.
 * @returns A string representing the time difference in a human-readable format.
 */
export const getTimestamp = (createdAt: Date, locale = 'en', timeZone?: string): string => {
  if (Number.isNaN(createdAt.getTime())) return '-'

  const elapsedSeconds = (createdAt.getTime() - Date.now()) / 1000
  const weekInSeconds = 7 * 24 * 60 * 60
  if (Math.abs(elapsedSeconds) >= weekInSeconds) {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(createdAt)
  }

  const intervals: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: 'day', seconds: 24 * 60 * 60 },
    { unit: 'hour', seconds: 60 * 60 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ]
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
  const interval = intervals.find((item) => Math.abs(elapsedSeconds) >= item.seconds) ?? intervals.at(-1)!

  return formatter.format(Math.trunc(elapsedSeconds / interval.seconds), interval.unit)
}

/**
 * Converts bytes to a human-readable format.
 * @param bytes The number of bytes.
 * @returns A string representing the byte size in a human-readable format.
 */
export const bytesFormat = (
  bytes: number,
  options: {
    standard?: 's' | 'm'
    decimalPlaces?: number
  } = {},
): string => {
  if (bytes === 0) return '0 B' // Special-case zero
  if (isNaN(bytes) || bytes < 0) return '--'

  const { standard = 's', decimalPlaces = 2 } = options
  const base = standard === 's' ? 1024 : 1000

  const symbols = standard === 's' ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  if (bytes > 0 && bytes < 1) {
    return `${parseFloat(bytes.toFixed(decimalPlaces))} B`
  }

  // Use logarithms to avoid a manual loop
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(base)))

  // Clamp the computed index to the available range
  const unitIndex = Math.min(i, symbols.length - 1)

  const val = bytes / Math.pow(base, unitIndex)

  // Trim trailing zeroes automatically.
  // Example: 10.00 MB -> 10 MB, 10.50 MB -> 10.5 MB
  const formattedValue = parseFloat(val.toFixed(decimalPlaces))

  return `${formattedValue} ${symbols[unitIndex]}`
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '-'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export function formatBytesPerSecond(bytesPerSecond?: number | null): string {
  const value = typeof bytesPerSecond === 'number' && Number.isFinite(bytesPerSecond) ? bytesPerSecond : 0
  return `${formatBytes(value)}/s`
}

export function formatStatValue(value: string | number, loading: boolean, placeholder = '-'): string {
  return loading ? placeholder : String(value)
}

export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`
}

export function formatOptionalNumber(value: number | null | undefined, suffix: string): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'

  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
  return `${formatted}${suffix}`
}

export function formatUptime(
  seconds: number,
  formatter?: {
    daysHours: (days: number, hours: number) => string
    hours: (hours: number) => string
  },
): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)

  if (formatter) {
    return days > 0 ? formatter.daysHours(days, hours) : formatter.hours(hours)
  }

  if (days > 0) return `${days} 天 ${hours.toString().padStart(2, '0')} 小时`
  return `${hours} 小时`
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export const hoursFormat = (totalHours: number): string => {
  const HOURS_PER_DAY = 24
  const DAYS_PER_YEAR = 365
  const DAYS_PER_MONTH = 30.44

  const totalDays = totalHours / HOURS_PER_DAY

  const years = Math.floor(totalDays / DAYS_PER_YEAR)
  const remainingDaysAfterYears = totalDays % DAYS_PER_YEAR

  const months = Math.floor(remainingDaysAfterYears / DAYS_PER_MONTH)
  const remainingDaysAfterMonths = remainingDaysAfterYears % DAYS_PER_MONTH

  const days = Math.floor(remainingDaysAfterMonths)
  const remainingHours = Math.round((remainingDaysAfterMonths - days) * HOURS_PER_DAY)

  const parts = []
  if (years > 0) parts.push(`${years}年`)
  if (months > 0) parts.push(`${months}个月`)
  if (days > 0) parts.push(`${days}天`)
  if (remainingHours > 0 || parts.length === 0) {
    parts.push(`${remainingHours}小时`)
  }

  return parts.join('')
}
export const lbaToBytes = (lbaWritten: number, sectorSize = 512) => {
  if (sectorSize !== 512 && sectorSize !== 4096) {
    throw new Error('扇区大小必须是 512 或 4096 字节')
  }
  return lbaWritten * sectorSize
}
/**
 * Checks if a given string is a valid URL.
 * @param url The URL string to validate.
 * @returns `true` if the URL is valid, otherwise `false`.
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Extracts the file extension from a filename.
 * @param filename The filename from which to extract the extension.
 * @returns The file extension in lowercase.
 */
export const getType = (filename: string) => {
  const data = filename.split('.')
  return (data[data.length - 1] || '')?.toLocaleLowerCase()
}

/**
 * Converts an ArrayBuffer to a Base64 encoded string.
 * @param buffer The ArrayBuffer to convert.
 * @returns The Base64 encoded string.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Converts an ArrayBuffer to a text string using UTF-8 encoding.
 * @param buffer The ArrayBuffer to convert.
 * @returns The decoded text string.
 */
export const arrayBufferToText = (buffer: ArrayBuffer): string => {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(buffer)
}

export const getNanoid = (len = 16): string => {
  return nanoid(len)
}

/**
 * Formats a date like: 2023/2/2 22:11:33
 * @param date Accepts a Date object, ISO string, or timestamp
 */
/**
 * Formats a date like: 2023/2/2 22:11:33
 * @param dateStr Accepts a Date object, string, or timestamp
 */
export function formatDateTime(dateStr: Date | string | number | null | undefined, timeZone?: string): string {
  if (!dateStr) return '--'

  const d = new Date(dateStr)

  // Guard against invalid dates
  if (isNaN(d.getTime())) return '--'

  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('zh-CN', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
        .formatToParts(d)
        .reduce<Record<string, string>>((acc, part) => {
          acc[part.type] = part.value
          return acc
        }, {})

      return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
    } catch {
      return '--'
    }
  }

  const year = d.getFullYear()
  // JavaScript months are zero-based
  const month = d.getMonth() + 1
  const day = d.getDate()

  const hours = d.getHours().toString().padStart(2, '0')
  // Pad minutes and seconds to two digits
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  // Return the 2023/2/2 22:11:33 format
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

type DateParts = {
  year: number
  month: number
  day: number
  hour: string
  minute: string
}

const SMART_TIME_THRESHOLDS = [
  { maxMs: 60 * 1000, unitMs: 1000, unit: 'second' },
  { maxMs: 60 * 60 * 1000, unitMs: 60 * 1000, unit: 'minute' },
  { maxMs: 24 * 60 * 60 * 1000, unitMs: 60 * 60 * 1000, unit: 'hour' },
]

function getDateParts(date: Date, timeZone?: string): DateParts {
  if (!timeZone) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours().toString().padStart(2, '0'),
      minute: date.getMinutes().toString().padStart(2, '0'),
    }
  }

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour ?? '00',
    minute: parts.minute ?? '00',
  }
}

function calendarDayNumber(parts: Pick<DateParts, 'year' | 'month' | 'day'>): number {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000)
}

/**
 * Formats timestamps for compact activity lists.
 * Examples: just now, 5 minutes ago, 2 hours ago, 昨天 23:10, 前天 09:30, 2026/5/20 18:08:12.
 */
export function formatSmartTime(
  dateStr: Date | string | number | null | undefined,
  timeZone?: string,
  locale = 'en',
): string {
  return formatSmartTimeInfo(dateStr, timeZone, locale).text
}

export function formatSmartTimeInfo(
  dateStr: Date | string | number | null | undefined,
  timeZone?: string,
  locale = 'en',
): { text: string; fullText: string; showTooltip: boolean } {
  if (!dateStr) return { text: '--', fullText: '--', showTooltip: false }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return { text: '--', fullText: '--', showTooltip: false }

  const fullText = formatDateTime(date, timeZone)

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (diffMs >= 0) {
    const threshold = SMART_TIME_THRESHOLDS.find((item) => diffMs < item.maxMs)
    if (threshold) {
      const value =
        threshold.unit === 'second' && diffMs < 10_000 ? 0 : -Math.max(1, Math.floor(diffMs / threshold.unitMs))
      return {
        text: relativeFormatter.format(value, threshold.unit as Intl.RelativeTimeFormatUnit),
        fullText,
        showTooltip: true,
      }
    }
  }

  try {
    const currentParts = getDateParts(now, timeZone)
    const targetParts = getDateParts(date, timeZone)
    const dayDiff = calendarDayNumber(currentParts) - calendarDayNumber(targetParts)
    const timeText = `${targetParts.hour}:${targetParts.minute}`

    if (dayDiff === 1 || dayDiff === 2) {
      return {
        text: `${relativeFormatter.format(-dayDiff, 'day')} ${timeText}`,
        fullText,
        showTooltip: true,
      }
    }
    return { text: fullText, fullText, showTooltip: false }
  } catch {
    return { text: fullText, fullText, showTooltip: false }
  }
}

/**
 * Use this when you need a zero-padded format like 2023/02/02 22:11:33
 */
export function formatDateTimePadded(date: Date | string | number): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')

  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
/**
 * Encodes a filesystem path into a URL-safe ID
 */
export function encodeFilePath(path: string): string {
  // Start with standard Base64 encoding
  const base64 = btoa(path)
  // Convert Base64 into a URL-safe variant (+ -> -, / -> _) and strip padding (=)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function getProgressColorClass(value: number): string {
  return value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
}

export function formatUsagePercent(usedBytes: number, totalBytes: number, raw: number): string {
  if (!Number.isFinite(raw) || raw <= 0) {
    return usedBytes > 0 && totalBytes > 0 ? '1%' : '0%'
  }
  const rounded = Math.round(raw)
  if (rounded <= 0 && usedBytes > 0 && totalBytes > 0) return '1%'
  return `${rounded}%`
}
export function calculateUsedPercent(usedBytes: number, totalBytes: number, minVisiblePercent = 1): number {
  if (totalBytes <= 0) {
    return 0
  }
  const rawPercent = (usedBytes / totalBytes) * 100

  if (usedBytes > 0 && rawPercent < minVisiblePercent) {
    return minVisiblePercent
  }

  return Math.min(100, Math.max(0, rawPercent))
}

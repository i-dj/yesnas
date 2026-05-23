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

  const getPriority = (value: any): number => {
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
 * @returns A string representing the time difference in a human-readable format.
 */
export const getTimestamp = (createdAt: Date): string => {
  const now = new Date()
  const timeDifference = now.getTime() - createdAt.getTime()

  // Define time intervals in milliseconds
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (timeDifference < minute) {
    const seconds = Math.floor(timeDifference / 1000)
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`
  } else if (timeDifference < hour) {
    const minutes = Math.floor(timeDifference / minute)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (timeDifference < day) {
    const hours = Math.floor(timeDifference / hour)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (timeDifference < week) {
    const days = Math.floor(timeDifference / day)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (timeDifference < month) {
    const weeks = Math.floor(timeDifference / week)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else if (timeDifference < year) {
    const months = Math.floor(timeDifference / month)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  } else {
    const years = Math.floor(timeDifference / year)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
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

  const { standard = 'm', decimalPlaces = 2 } = options
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

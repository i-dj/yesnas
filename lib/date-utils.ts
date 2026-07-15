export type DateRangePreset = '24h' | '7d' | '30d' | '90d' | '1y'
export type DateBucket = 'hour' | 'day' | 'month'

type ZonedDateTime = {
  local: string
  iso: string
}

export function getDateRange(range: DateRangePreset, timeZone: string) {
  const to = new Date()
  const from = new Date(to)

  if (range === '24h') from.setHours(from.getHours() - 24)
  if (range === '7d') from.setDate(from.getDate() - 7)
  if (range === '30d') from.setDate(from.getDate() - 30)
  if (range === '90d') from.setDate(from.getDate() - 90)
  if (range === '1y') from.setFullYear(from.getFullYear() - 1)

  return {
    from: toLocalDateTime(from, timeZone),
    to: toLocalDateTime(to, timeZone),
  }
}

export function getDateBucketRange(value: string, bucket: DateBucket) {
  const from =
    bucket === 'month'
      ? new Date(`${value}-01T00:00:00Z`)
      : bucket === 'day'
        ? new Date(`${value}T00:00:00Z`)
        : new Date(`${value}Z`)
  const to = new Date(from)

  if (bucket === 'hour') to.setUTCHours(to.getUTCHours() + 1)
  if (bucket === 'day') to.setUTCDate(to.getUTCDate() + 1)
  if (bucket === 'month') to.setUTCMonth(to.getUTCMonth() + 1)

  return { from: from.toISOString(), to: to.toISOString() }
}

export function getZonedDateTime(
  value: Date | string | number | null | undefined,
  timeZone: string,
): ZonedDateTime | undefined {
  if (value === null || value === undefined || value === '') return undefined

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : typeof value === 'string' && !hasTimeZone(value)
        ? zonedTimeToDate(value, timeZone)
        : new Date(value)

  if (Number.isNaN(date.getTime())) return undefined

  const local = toLocalDateTime(date, timeZone)

  return {
    local,
    iso: date.toISOString(),
  }
}

export function formatDateRange(
  from: string,
  to: string,
  locale: string,
  timeZone: string,
) {
  const fromDate = getZonedDateTime(from, timeZone)
  const toDate = getZonedDateTime(to, timeZone)
  if (!fromDate || !toDate) return '-'

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  return `${formatter.format(new Date(fromDate.iso))} - ${formatter.format(new Date(toDate.iso))}`
}

function hasTimeZone(value: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
}

function toLocalDateTime(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || ''

  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`
}

function zonedTimeToDate(value: string, timeZone: string) {
  const [datePart, timePart = '00:00'] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second = 0] = timePart.split(':').map(Number)
  const wallTime = Date.UTC(year, month - 1, day, hour, minute, second)
  let date = new Date(wallTime)

  for (let attempt = 0; attempt < 2; attempt += 1) {
    date = new Date(wallTime - getTimeZoneOffset(date, timeZone))
  }

  return date
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value || 0)

  return (
    Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
      part('second'),
    ) - date.getTime()
  )
}

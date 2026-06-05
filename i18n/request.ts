import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export default getRequestConfig(async () => {
  const locale = await resolveLocale()

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

const supportedLocales = ['zh', 'ja', 'ko', 'en'] as const
type SupportedLocale = (typeof supportedLocales)[number]

async function resolveLocale(): Promise<SupportedLocale> {
  const cookieLocale = (await cookies()).get('yesnas-locale')?.value
  if (isSupportedLocale(cookieLocale)) return cookieLocale

  const acceptLanguage = (await headers()).get('accept-language') ?? ''
  return getPreferredLocale(acceptLanguage)
}

function getPreferredLocale(acceptLanguage: string): SupportedLocale {
  const candidates = acceptLanguage
    .split(',')
    .map((item) => item.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean)

  for (const candidate of candidates) {
    if (candidate.startsWith('zh')) return 'zh'
    if (candidate.startsWith('ja')) return 'ja'
    if (candidate.startsWith('ko')) return 'ko'
    if (candidate.startsWith('en')) return 'en'
  }

  return 'zh'
}

function isSupportedLocale(locale: unknown): locale is SupportedLocale {
  return typeof locale === 'string' && supportedLocales.includes(locale as SupportedLocale)
}

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export const ThemeToggle = () => {
  const t = useTranslations('Common.theme')
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="bg-app-active h-9 w-34 animate-pulse rounded-full" />
  }

  const options = [
    { value: 'system', icon: Laptop, label: t('system') },
    { value: 'light', icon: Sun, label: t('light') },
    { value: 'dark', icon: Moon, label: t('dark') },
  ] as const

  return (
    <div className="border-app-border-strong inline-flex items-center rounded-full border">
      {options.map((option) => {
        const Icon = option.icon
        const active = theme === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={option.label}
            className={cn(
              'text-app-text-muted flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ease-out',
              active && 'bg-app-bg-highlight border-app-border-strong text-app-bg',
              !active && 'hover:bg-app-hover hover:text-app-text',
            )}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}

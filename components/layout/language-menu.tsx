'use client'

import { cn } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'

const localeOptions = [
  { value: 'zh', flag: '/flags/cn.svg', name: '中文', code: 'ZH' },
  { value: 'ja', flag: '/flags/jp.svg', name: '日本語', code: 'JA' },
  { value: 'ko', flag: '/flags/kr.svg', name: '한국어', code: 'KO' },
  { value: 'en', flag: '/flags/us.svg', name: 'English', code: 'EN' },
] as const

export function LanguageMenu({
  currentLocale,
  onChange,
  variant = 'app',
}: {
  currentLocale: string
  onChange: () => void
  variant?: 'app' | 'auth'
}) {
  const currentOption = localeOptions.find((option) => option.value === currentLocale) ?? localeOptions[0]

  const handleChange = (locale: (typeof localeOptions)[number]['value']) => {
    document.cookie = `yesnas-locale=${locale}; path=/; max-age=31536000; samesite=lax`
    onChange()
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={currentOption.name}
          className={cn(
            'group flex h-9 w-9 items-center rounded-lg border px-2 text-sm outline-none transition-all sm:w-auto sm:min-w-44 sm:px-3',
            'data-[state=open]:border-[#4da3ff] data-[state=open]:shadow-[0_0_0_4px_rgba(77,163,255,0.22)]',
            variant === 'auth'
              ? 'border-white/12 bg-[#1b1e23] text-white hover:border-white/25'
              : 'border-app-border bg-app-surface text-app-text hover:bg-app-hover',
          )}
        >
          <Flag src={currentOption.flag} />
          <span className="ml-2 hidden whitespace-nowrap sm:inline">{currentOption.name}</span>
          <span className={cn('ml-1.5 hidden font-normal sm:inline', variant === 'auth' ? 'text-white/40' : 'text-app-text-muted')}>
            ({currentOption.code})
          </span>
          <ChevronDown
            size={16}
            className="ml-auto hidden shrink-0 opacity-40 transition-transform duration-200 group-data-[state=open]:rotate-180 sm:block"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-(--radix-dropdown-menu-trigger-width) rounded-lg border border-white/5 bg-[#1b1e23] p-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.42)] outline-none"
        >
          {localeOptions.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => handleChange(option.value)}
              className="flex h-10 cursor-pointer items-center rounded-md px-2.5 text-sm text-white/85 outline-none transition-colors data-highlighted:bg-white/7 data-highlighted:text-white"
            >
              <Flag src={option.flag} />
              <span className="ml-2 whitespace-nowrap">{option.name}</span>
              <span className="ml-1.5 whitespace-nowrap font-normal text-white/40">({option.code})</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function Flag({ src }: { src: string }) {
  return <img src={src} alt="" className="size-5 shrink-0 rounded-full object-cover shadow-sm" />
}

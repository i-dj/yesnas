'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown } from 'lucide-react'
import type { CategoryColor } from '@nextdj/file-explorer'
import { FILE_CATEGORY_COLORS } from '../constants'
import { cn } from '@/lib/utils'
import { ColorTags } from './color-tags'
import { Checkbox } from '@/components/ui'

interface ColorFilterSelectProps {
  selectedColors: CategoryColor[]
  onChange: (colors: CategoryColor[]) => void
  active?: boolean
  onActivate?: () => void
}

export const ColorFilterSelect = ({ selectedColors, onChange, active = false, onActivate }: ColorFilterSelectProps) => {
  const t = useTranslations('File.filters')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const colorOptions = useMemo(
    () =>
      Object.entries(FILE_CATEGORY_COLORS).map(([value, config]) => ({
        value: value as CategoryColor,
        label: t(`colors.${value}`),
        bgClass: config.bgClass,
      })),
    [t],
  )

  const displayColors = useMemo(
    () => (selectedColors.length > 0 ? selectedColors : colorOptions.slice(0, 3).map((option) => option.value)),
    [colorOptions, selectedColors],
  )

  const label = useMemo(() => {
    if (selectedColors.length === 0) return t('allTags')

    if (selectedColors.length === 1) {
      return t(`colors.${selectedColors[0]}`)
    }

    return t('tagCount', { count: selectedColors.length })
  }, [selectedColors, t])

  const toggleColor = (color: CategoryColor) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((item) => item !== color)
      : [...selectedColors, color]

    onActivate?.()
    onChange(next)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) onActivate?.()
      }}
    >
      <Popover.Anchor>
        <div
          className={cn(
            'bg-app-surface hover:border-app-border-strong flex h-8 items-stretch overflow-hidden rounded-lg border text-[12px] transition-colors duration-200 ease-out',
            active || open
              ? 'border-app-border-strong text-app-text'
              : 'border-app-border text-app-text-muted hover:text-app-text',
          )}
        >
          <button type="button" onClick={() => onActivate?.()} className="flex items-center gap-2 px-4 outline-none">
            <ColorTags colors={displayColors} size={12} className="mr-0.5" />
            <span className="max-w-23 truncate font-medium">{label}</span>
          </button>
          <button
            type="button"
            aria-label={t('openTagFilter')}
            className="flex items-center border-l border-current/15 px-3 outline-none"
            onClick={() => {
              setOpen((current) => !current)
              onActivate?.()
            }}
          >
            <ChevronDown size={16} className={cn('transition-transform', mounted && open && 'rotate-180')} />
          </button>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="bg-app-bg border-app-border z-50 w-44 rounded-2xl border p-1.5 shadow-lg outline-none"
        >
          <Checkbox
            label={t('allTags')}
            checked={selectedColors.length === 0}
            onChange={() => onChange([])}
            className="hover:bg-app-hover h-8 w-full justify-between px-2.5 text-xs"
            contentClassName="font-medium"
            markClassName="order-2"
          />

          {colorOptions.map((option) => {
            const checked = selectedColors.includes(option.value)

            return (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={checked}
                onChange={() => toggleColor(option.value)}
                leading={
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.12)]', option.bgClass)}
                  />
                }
                className="hover:bg-app-hover h-8 w-full justify-between px-2.5 text-xs"
                contentClassName="font-medium"
                markClassName="order-2"
              />
            )
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

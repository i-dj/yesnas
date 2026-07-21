'use client'

import React, { useId } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ToggleButtonItem<T extends string> {
  value: T
  label?: React.ReactNode
  icon?: LucideIcon
  badge?: React.ReactNode
}

interface ToggleButtonProps<T extends string> {
  readonly items: readonly ToggleButtonItem<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  className?: string
  itemClassName?: string
  showSeparator?: boolean
  variant?: 'tabs' | 'segmented' | 'surface'
  shape?: 'pill' | 'rounded'
  allowReselect?: boolean
  showSelectionIndicator?: boolean
}

export const ToggleButton = <T extends string>({
  items,
  value,
  defaultValue,
  onChange,
  className,
  itemClassName,
  variant = 'tabs',
  showSeparator = false,
  shape = 'pill',
  allowReselect = false,
  showSelectionIndicator = false,
}: ToggleButtonProps<T>) => {
  const isTabs = variant === 'tabs'
  const isSurface = variant === 'surface'
  const instanceId = useId()
  const activePillLayoutId = `active-pill-${instanceId}`
  const activeUnderlineLayoutId = `active-underline-${instanceId}`

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => {
        if (val) onChange?.(val as T)
      }}
      className={cn(
        'relative inline-flex items-stretch transition-all',
        isSurface
          ? 'bg-app-hover/30 h-11 max-w-full gap-1 rounded-xl p-1'
          : isTabs
            ? cn('h-8 gap-1 border-none bg-transparent', shape === 'pill' ? 'rounded-full' : 'rounded-lg')
            : 'border-app-border h-9 w-full border-b-2 bg-transparent',
        className,
      )}
    >
      {items.map((item, index) => {
        const isSelected = value === item.value

        return (
          <React.Fragment key={item.value}>
            <ToggleGroup.Item
              value={item.value}
              onClick={() => {
                if (allowReselect && value === item.value) onChange?.(item.value)
              }}
              className={cn(
                'relative flex items-center justify-center px-3 text-sm transition-all outline-none',
                isTabs ? 'flex-1' : 'flex-none',
                isSurface
                  ? 'text-app-text-muted hover:bg-app-hover hover:text-app-text data-[state=on]:text-app-text h-full rounded-lg px-4'
                  : isTabs
                    ? cn(
                        'text-app-text-muted hover:bg-app-hover hover:text-app-text data-[state=on]:text-app-text',
                        shape === 'pill' ? 'rounded-full' : 'rounded-md',
                      )
                    : 'text-app-text-muted hover:text-app-text data-[state=on]:text-app-text rounded-none',
                itemClassName,
              )}
            >
              {(isTabs || isSurface) && isSelected && (
                <motion.div
                  layoutId={activePillLayoutId}
                  className={cn(
                    'bg-app-active absolute inset-0 z-0',
                    isSurface ? 'rounded-lg' : shape === 'pill' ? 'rounded-full' : 'rounded-md',
                  )}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              )}
              <div className="relative z-10 flex min-w-0 items-center gap-1.5">
                {showSelectionIndicator && (
                  <span
                    className={cn(
                      'border-app-border flex size-3.5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected && 'border-app-text',
                    )}
                  >
                    {isSelected ? <span className="bg-app-text block size-1 rounded-full" /> : null}
                  </span>
                )}
                {item.icon && <item.icon size={16} strokeWidth={2} />}
                {item.label && <div className="whitespace-nowrap">{item.label}</div>}
                {item.badge && (
                  <span className="bg-theme/10 text-theme rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                    {item.badge}
                  </span>
                )}
              </div>

              {!isTabs && !isSurface && isSelected && (
                <motion.div
                  layoutId={activeUnderlineLayoutId}
                  className="bg-app-text absolute right-0 -bottom-0.5 left-0 h-0.5"
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              )}
            </ToggleGroup.Item>

            {showSeparator && isTabs && index < items.length - 1 && (
              <div className="bg-app-border h-4 w-px self-center transition-opacity" />
            )}
          </React.Fragment>
        )
      })}
    </ToggleGroup.Root>
  )
}

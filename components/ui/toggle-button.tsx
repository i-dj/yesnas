'use client'

import React, { useId } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ToggleButtonItem<T extends string> {
  value: T
  label?: React.ReactNode
  icon?: LucideIcon
}

interface ToggleButtonProps<T extends string> {
  readonly items: readonly ToggleButtonItem<T>[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  className?: string
  itemClassName?: string
  showSeparator?: boolean
  variant?: 'tabs' | 'segmented'
}

export const ToggleButton = <T extends string>({
  items,
  value,
  defaultValue,
  onChange,
  className,
  itemClassName,
  variant = 'tabs',
  showSeparator = true,
}: ToggleButtonProps<T>) => {
  const isTabs = variant === 'tabs'
  const instanceId = useId()
  const activePillLayoutId = `active-pill-${instanceId}`
  const activeUnderlineLayoutId = `active-underline-${instanceId}`

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      defaultValue={defaultValue}
      onValueChange={(val) => val && onChange?.(val as T)}
      className={cn(
        'relative inline-flex h-9 items-stretch transition-all',
        isTabs
          ? 'border-app-border bg-app-surface rounded-full border'
          : 'border-app-border w-full border-b-2 bg-transparent',
        className,
      )}
    >
      {items.map((item, index) => {
        const isSelected = value === item.value

        return (
          <React.Fragment key={item.value}>
            <ToggleGroup.Item
              value={item.value}
              className={cn(
                'relative flex items-center justify-center px-3 text-sm transition-all outline-none',
                isTabs ? 'flex-1' : 'flex-none',
                isTabs
                  ? 'text-app-text-muted hover:bg-app-hover hover:text-app-text data-[state=on]:text-app-text rounded-full'
                  : 'text-app-text-muted hover:text-app-text data-[state=on]:text-app-text rounded-none',
                itemClassName,
              )}
            >
              {isTabs && isSelected && (
                <motion.div
                  layoutId={activePillLayoutId}
                  className="bg-app-active absolute inset-0 z-0 rounded-full"
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-1.5">
                {item.icon && <item.icon size={16} strokeWidth={2} />}
                {item.label && (
                  <div className="font-medium whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>

              {!isTabs && isSelected && (
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

'use client'

import React, { useEffect, useId, useState } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ActionMenu } from './action-menu'

interface ToggleButtonItem<T extends string> {
  value: T
  label?: React.ReactNode
  icon?: LucideIcon
  badge?: React.ReactNode
  render?: (props: { item: ToggleButtonItem<T>; selected: boolean; defaultContent: React.ReactNode }) => React.ReactNode
  trailing?: (props: { item: ToggleButtonItem<T>; selected: boolean }) => React.ReactNode
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
  activeIndicatorClassName?: string
  showMaxItems?: number
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
  activeIndicatorClassName,
  showMaxItems,
}: ToggleButtonProps<T>) => {
  const isTabs = variant === 'tabs'
  const isSurface = variant === 'surface'
  const instanceId = useId()
  const activePillLayoutId = `active-pill-${instanceId}`
  const activeUnderlineLayoutId = `active-underline-${instanceId}`
  const shouldCollapse = Boolean(showMaxItems && showMaxItems > 1 && items.length > showMaxItems)
  const visibleItems = shouldCollapse ? items.slice(0, showMaxItems! - 1) : items
  const overflowItems = shouldCollapse ? items.slice(showMaxItems! - 1) : []
  const activeOverflowItem = overflowItems.find((item) => item.value === value)
  const [lastOverflowValue, setLastOverflowValue] = useState<T | undefined>(activeOverflowItem?.value)
  const lastOverflowItem = overflowItems.find((item) => item.value === lastOverflowValue)
  const overflowTriggerItem = activeOverflowItem ?? lastOverflowItem ?? overflowItems[0]

  useEffect(() => {
    if (activeOverflowItem) setLastOverflowValue(activeOverflowItem.value)
  }, [activeOverflowItem])

  const renderDefaultContent = (item: ToggleButtonItem<T>, isSelected: boolean, showDropdownIcon = false) => (
    <>
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
      {item.label && <span className="whitespace-nowrap">{item.label}</span>}
      {item.badge !== undefined && item.badge !== null && (
        <span className="bg-theme/10 text-theme rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
          {item.badge}
        </span>
      )}
      {showDropdownIcon ? <ChevronDown className="size-3.5 shrink-0" /> : null}
    </>
  )

  const renderButton = (item: ToggleButtonItem<T>, isSelected: boolean, content: React.ReactNode) => (
    <ToggleGroup.Item
      value={item.value}
      onClick={() => {
        if (allowReselect && value === item.value) onChange?.(item.value)
      }}
      className={cn(
        'relative flex h-full items-center justify-center px-3 text-sm transition-all outline-none',
        isTabs ? 'flex-1' : 'flex-none',
        isSurface
          ? 'text-app-text-muted hover:bg-app-hover hover:text-app-text data-[state=on]:text-app-text h-full rounded-md px-4'
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
            'bg-app-border  absolute inset-0 z-0',
            isSurface ? 'rounded-md' : shape === 'pill' ? 'rounded-full' : 'rounded-md',
          )}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        />
      )}
      <div className="relative z-10 flex min-w-0 items-center gap-1.5">{content}</div>
    </ToggleGroup.Item>
  )

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
          ? 'bg-app-bg border border-app-border h-11 max-w-full gap-1 rounded-xl p-1'
          : isTabs
            ? cn('h-8 gap-1 border-none bg-transparent', shape === 'pill' ? 'rounded-full' : 'rounded-lg')
            : 'border-app-border h-9 w-full border-b-2 bg-transparent',
        className,
      )}
    >
      {visibleItems.map((item, index) => {
        const isSelected = value === item.value
        const defaultContent = renderDefaultContent(item, isSelected)
        const button = renderButton(
          item,
          isSelected,
          item.render ? item.render({ item, selected: isSelected, defaultContent }) : defaultContent,
        )

        return (
          <React.Fragment key={item.value}>
            <div className={cn('relative flex h-full items-stretch gap-0', isTabs ? 'flex-1' : 'flex-none')}>
              {button}
              {item.trailing ? item.trailing({ item, selected: isSelected }) : null}
              {!isTabs && !isSurface && isSelected && (
                <motion.div
                  layoutId={activeUnderlineLayoutId}
                  className={cn('bg-app-text absolute right-0 -bottom-0.5 left-0 h-0.5', activeIndicatorClassName)}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                />
              )}
            </div>

            {showSeparator && isTabs && index < visibleItems.length - 1 && (
              <div className="bg-app-border h-4 w-px self-center transition-opacity" />
            )}
          </React.Fragment>
        )
      })}

      {overflowTriggerItem ? (
        <div className={cn('relative flex h-full items-stretch gap-0', isTabs ? 'flex-1' : 'flex-none')}>
          <ActionMenu
            mode="left-click"
            align="start"
            onAction={(action) => {
              setLastOverflowValue(action as T)
              onChange?.(action as T)
            }}
            items={overflowItems.map((item) => ({
              action: item.value,
              icon: item.icon,
              className:
                item.value === value ? 'bg-app-active text-app-text border-app-border-strong border' : undefined,
              label: (
                <span className="flex min-w-0 items-center gap-2 text-left">
                  {item.label ? <span className="truncate">{item.label}</span> : null}
                  {item.badge !== undefined && item.badge !== null ? (
                    <span className="bg-theme/10 text-theme rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              ),
            }))}
            trigger={
              <div className="h-full">
                {renderButton(
                  overflowTriggerItem,
                  Boolean(activeOverflowItem),
                  overflowTriggerItem.render
                    ? overflowTriggerItem.render({
                        item: overflowTriggerItem,
                        selected: Boolean(activeOverflowItem),
                        defaultContent: renderDefaultContent(overflowTriggerItem, Boolean(activeOverflowItem), true),
                      })
                    : renderDefaultContent(overflowTriggerItem, Boolean(activeOverflowItem), true),
                )}
              </div>
            }
          />
          {overflowTriggerItem.trailing
            ? overflowTriggerItem.trailing({ item: overflowTriggerItem, selected: Boolean(activeOverflowItem) })
            : null}
          {!isTabs && !isSurface && activeOverflowItem && (
            <motion.div
              layoutId={activeUnderlineLayoutId}
              className={cn('bg-app-text absolute right-0 -bottom-0.5 left-0 h-0.5', activeIndicatorClassName)}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            />
          )}
        </div>
      ) : null}
    </ToggleGroup.Root>
  )
}

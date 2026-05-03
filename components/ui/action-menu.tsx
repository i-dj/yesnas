'use client'

import React, { useEffect, useState, useId } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { motion, AnimatePresence, Variants } from 'framer-motion' // Used for menu enter/exit transitions
export interface ActionMenuConfig {
  label?: React.ReactNode
  action?: string
  icon?: any
  className?: string
  disabled?: boolean
  separator?: boolean
  isHeader?: boolean
  checked?: boolean
  isDelete?: boolean
  render?: (helpers: { closeMenu: () => void }) => React.ReactNode
  onSelect?: () => void | Promise<void>
}

interface ActionMenuProps {
  children?: React.ReactNode
  trigger?: React.ReactNode
  onAction: (action: string) => void
  items: ActionMenuConfig[]
  title?: string
  mode?: 'right-click' | 'left-click'
  align?: 'start' | 'center' | 'end'
  iconPosition?: 'left' | 'right'
  itemJustify?: 'start' | 'between'
}

export const ActionMenu = ({
  children,
  trigger,
  onAction,
  items,
  title,
  mode = 'right-click',
  align = 'start',
  iconPosition = 'left',
  itemJustify = 'start',
}: ActionMenuProps) => {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const safeId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return trigger || children

  const menuVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.94,
      y: -4,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.15, ease: 'easeIn' },
    },
  }

  const renderIcon = (item: ActionMenuConfig) => (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
      {item.checked ? (
        <Check size={16} strokeWidth={3} className="text-app-text" />
      ) : item.icon ? (
        React.isValidElement(item.icon) ? (
          item.icon
        ) : (
          (() => {
            const Icon = item.icon as any
            return <Icon size={16} />
          })()
        )
      ) : null}
    </div>
  )

  const renderItems = (MenuItem: any) => (
    <div className="flex flex-col gap-0.5">
      {title && (
        <div className="border-app-border mb-1 border-b px-3 py-2 select-none">
          <span className="text-app-text-sub text-[11px] leading-none font-bold tracking-widest uppercase">
            {title}
          </span>
        </div>
      )}
      {items.map((item, index) => (
        <React.Fragment key={`${item.action}-${index}`}>
          {item.render ? (
            <div className={cn('px-1', item.className)}>
              {item.render({ closeMenu: () => setOpen(false) })}
            </div>
          ) : item.isHeader ? (
            <div className="mt-1 px-3 py-0 select-none">
              <span className="text-app-text-sub text-[10px] font-medium tracking-wider uppercase">
                {item.label}
              </span>
            </div>
          ) : (
            <MenuItem
              disabled={item.disabled}
              onSelect={() => {
                item.onSelect?.()
                if (item.action) {
                  onAction(item.action)
                } else {
                  setOpen(false)
                }
              }}
              className={cn(
                'group flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-200 ease-out outline-none',
                itemJustify === 'between'
                  ? 'justify-between gap-4'
                  : 'justify-start gap-3',
                !item.isDelete && 'text-app-text-muted',
                !item.isDelete
                  ? 'data-highlighted:bg-app-hover data-highlighted:text-app-text'
                  : 'text-red-500 data-highlighted:bg-red-500/10 data-highlighted:text-red-600',
                item.checked &&
                  'bg-app-active text-app-text border-app-border-strong border',
                'data-disabled:cursor-not-allowed data-disabled:opacity-40',
                item.className,
              )}
            >
              {iconPosition === 'left' ? (
                <>
                  {renderIcon(item)}
                  <span
                    className={cn(
                      'text-left',
                      itemJustify === 'between' ? 'flex-1' : 'min-w-0',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      'text-left',
                      itemJustify === 'between' ? 'flex-1' : 'min-w-0',
                    )}
                  >
                    {item.label}
                  </span>
                  {renderIcon(item)}
                </>
              )}
            </MenuItem>
          )}
          {item.separator && <div className="bg-app-border mx-2 my-1 h-px" />}
        </React.Fragment>
      ))}
    </div>
  )

  const contentClassName = cn(
    'bg-app-bg min-w-56 mx-2 overflow-hidden rounded-xl border border-app-border shadow-xl',
    'p-1.5',
  )

  const TriggerNode = trigger || children

  if (mode === 'left-click') {
    return (
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>{TriggerNode}</DropdownMenu.Trigger>
        <DropdownMenu.Portal forceMount>
          <AnimatePresence>
            {open && (
              <DropdownMenu.Content
                asChild
                align={align}
                sideOffset={8}
                className={contentClassName}
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={menuVariants}
                  className="origin-(--radix-dropdown-menu-content-transform-origin)"
                >
                  {renderItems(DropdownMenu.Item)}
                </motion.div>
              </DropdownMenu.Content>
            )}
          </AnimatePresence>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild id={safeId}>
        {TriggerNode}
      </ContextMenu.Trigger>
      <ContextMenu.Portal forceMount>
        <AnimatePresence>
          {open && (
            <ContextMenu.Content
              asChild
              collisionPadding={16}
              className={contentClassName}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={menuVariants}
                className="`origin-(--radix-context-menu-content-transform-origin)"
              >
                {renderItems(ContextMenu.Item)}
              </motion.div>
            </ContextMenu.Content>
          )}
        </AnimatePresence>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

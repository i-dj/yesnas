'use client'

import { cn } from '@/lib/utils'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  delayDuration?: number
  collisionPadding?: number
  className?: string
  disabled?: boolean
  triggerClassName?: string
}

export function Tooltip({
  content,
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset = 0,
  delayDuration = 180,
  collisionPadding = 10,
  className,
  disabled = false,
  triggerClassName,
}: TooltipProps) {
  if (disabled || !content) return <>{children}</>

  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span className={cn('inline-flex', triggerClassName)}>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            avoidCollisions
            collisionPadding={collisionPadding}
            sticky="partial"
            className={cn(
              'z-[120] max-w-72 rounded-md px-2 py-1 text-[11px] leading-snug shadow-md',
              'bg-black text-white',
              'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95',
              'data-[side=top]:slide-in-from-bottom-1 data-[side=right]:slide-in-from-left-1 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow
              width={10}
              height={6}
              style={{ fill: 'black' }}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

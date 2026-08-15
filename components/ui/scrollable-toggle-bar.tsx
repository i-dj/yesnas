'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './form/button'

interface ScrollableToggleBarProps {
  children: ReactNode
  className?: string
  viewportClassName?: string
  contentClassName?: string
  scrollAmount?: number
}

export function ScrollableToggleBar({
  children,
  className,
  viewportClassName,
  contentClassName,
  scrollAmount = 220,
}: ScrollableToggleBarProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const element = viewportRef.current
    if (!element) return

    const maxScrollLeft = element.scrollWidth - element.clientWidth
    setCanScrollLeft(element.scrollLeft > 1)
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 1)
  }, [])

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return

    updateScrollState()
    element.addEventListener('scroll', updateScrollState, { passive: true })

    const observer = new ResizeObserver(updateScrollState)
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)

    return () => {
      element.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState])

  const scrollBy = (direction: 'left' | 'right') => {
    viewportRef.current?.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative min-w-0', className)}>
      <div
        ref={viewportRef}
        className={cn(
          'min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          viewportClassName,
        )}
      >
        <div className={cn('flex min-w-max items-center', contentClassName)}>{children}</div>
      </div>

      {canScrollLeft ? (
        <ScrollControl direction="left" icon={ChevronLeft} label="向左滚动" onClick={() => scrollBy('left')} />
      ) : null}
      {canScrollRight ? (
        <ScrollControl direction="right" icon={ChevronRight} label="向右滚动" onClick={() => scrollBy('right')} />
      ) : null}
    </div>
  )
}

function ScrollControl({
  direction,
  icon,
  label,
  onClick,
}: {
  direction: 'left' | 'right'
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  const isLeft = direction === 'left'

  return (
    <>
      <div
        className={cn(
          'from-app-bg pointer-events-none absolute inset-y-0 z-10 w-14 to-transparent',
          isLeft ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l',
        )}
      />
      <Button
        type="button"
        variant="secondary"
        size="xs"
        icon={icon}
        iconSize={14}
        className={cn(
          'bg-app-bg/95 border-app-border absolute top-1/2 z-20 -translate-y-1/2 shadow-sm backdrop-blur',
          isLeft ? 'left-1' : 'right-1',
        )}
        aria-label={label}
        title={label}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      />
    </>
  )
}

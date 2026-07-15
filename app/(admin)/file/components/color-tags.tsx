'use client'

import { cn } from '@/lib/utils'
import type { CategoryColor } from '@nextdj/file-explorer'
import { FILE_CATEGORY_COLORS } from '../constants'

interface ColorTagsProps {
  colors: CategoryColor[]
  size?: number
  className?: string
}

export const ColorTags = ({ colors, size = 10, className }: ColorTagsProps) => {
  if (!colors || colors.length === 0) return null

  const uniqueColors = Array.from(new Set(colors))
    .filter((color): color is CategoryColor => color in FILE_CATEGORY_COLORS)
    .slice(0, 3)

  const overlap = size / 2.4
  const width =
    uniqueColors.length <= 1 ? size : size + (uniqueColors.length - 1) * overlap

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: `${width}px`, height: `${size}px` }}
    >
      {uniqueColors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className={cn(
            'absolute block rounded-full ring-1 ring-white',
            FILE_CATEGORY_COLORS[color].bgClass,
          )}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${index * overlap}px`,
            zIndex: uniqueColors.length - index,
          }}
        />
      ))}
    </div>
  )
}

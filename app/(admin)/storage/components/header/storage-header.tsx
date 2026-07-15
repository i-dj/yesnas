'use client'

import type { MouseEvent } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { HardDrive, Network, Plus, Usb } from 'lucide-react'
import type { PoolSource } from '../../types'
import { getPoolSourceHref } from '../../hooks/usePoolSource'

interface StorageHeaderProps {
  poolSource: PoolSource
  onSourceClick: (event: MouseEvent<HTMLAnchorElement>, source: PoolSource) => void
  onAddStorage: () => void
}

const poolSourceItems = [
  { value: 'local', label: '本地存储', icon: HardDrive },
  { value: 'network', label: '网络存储', icon: Network },
  { value: 'removable', label: '可移动存储', icon: Usb },
] as const

export function StorageHeader({ poolSource, onSourceClick, onAddStorage }: StorageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="bg-app-hover/30 flex h-11 items-center gap-2 rounded-xl p-1">
        {poolSourceItems.map((item) => {
          const Icon = item.icon
          const selected = poolSource === item.value

          return (
            <a
              key={item.value}
              href={getPoolSourceHref(item.value)}
              onClick={(event) => onSourceClick(event, item.value)}
              className={cn(
                'relative flex h-full items-center justify-center gap-1.5 rounded-xl px-5 text-sm transition-all',
                selected ? 'bg-app-active text-app-text' : 'text-app-text-muted hover:bg-app-hover hover:text-app-text',
              )}
            >
              <Icon className="size-4" />
              <span className="whitespace-nowrap">{item.label}</span>
            </a>
          )
        })}
      </nav>

      <div className="flex h-8 w-40 shrink-0 justify-end">
        {poolSource !== 'removable' ? (
          <Button   onClick={onAddStorage}>
            {poolSource === 'local' ? '添加本地存储' : '添加网络存储'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

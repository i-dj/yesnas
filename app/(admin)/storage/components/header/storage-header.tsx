'use client'

import { Button, ToggleButton } from '@/components/ui'
import { HardDrive, Network, Plus, Usb } from 'lucide-react'
import type { PoolSource } from '../../types'

interface StorageHeaderProps {
  poolSource: PoolSource
  onSourceChange: (source: PoolSource) => void
  onAddStorage: () => void
}

const poolSourceItems = [
  { value: 'local', label: '本地存储', icon: HardDrive },
  { value: 'network', label: '网络存储', icon: Network },
  { value: 'removable', label: '可移动存储', icon: Usb },
] as const

export function StorageHeader({ poolSource, onSourceChange, onAddStorage }: StorageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <ToggleButton items={poolSourceItems} value={poolSource} onChange={onSourceChange} variant="surface" />

      <div className="flex h-8 w-40 shrink-0 justify-end">
        {poolSource !== 'removable' ? (
          <Button icon={Plus} onClick={onAddStorage}>
            {poolSource === 'local' ? '添加本地存储' : '添加网络存储'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

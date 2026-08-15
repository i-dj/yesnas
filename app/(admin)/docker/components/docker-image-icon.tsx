'use client'

import { Package } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface DockerImageIconProps {
  icon?: string
  className?: string
}

export function DockerImageIcon({ icon, className }: DockerImageIconProps) {
  const [failed, setFailed] = useState(false)
  const isURL = Boolean(icon && /^https?:\/\//.test(icon))

  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-md bg-blue-500/10 text-blue-400', className)}>
      {isURL && !failed ? (
        <img src={icon} alt="" className="size-5 object-contain opacity-95" onError={() => setFailed(true)} />
      ) : (
        <Package size={18} />
      )}
    </span>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/use-notification-store'

interface NotificationBellProps {
  max?: number
}

export const NotificationBell = ({ max = 99 }: NotificationBellProps) => {
  const count = useNotificationStore((state) => state.count)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const triggerAnimations = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    setIsAnimating(false)
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })

    timerRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }, [])

  const prevCountRef = useRef(count)
  useEffect(() => {
    if (count > prevCountRef.current) {
      triggerAnimations()
    }
    prevCountRef.current = count
  }, [count, triggerAnimations])

  const badgeLabel = count > max ? `${max}+` : String(count)

  return (
    <>
      <style>{`
        @keyframes nb-ring {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-6deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes nb-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .animate-ring { animation: nb-ring 0.6s ease-out; transform-origin: top center; }
        .animate-pop { animation: nb-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>

      <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-gray-50">
        <div className={isAnimating ? 'animate-ring' : ''}>
          <Bell
            size={17}
            strokeWidth={2}
            className={count > 0 ? 'text-black' : 'text-gray-400'}
          />
        </div>

        {count > 0 && (
          <span
            className={`absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-[#E24B4A] px-1 text-[8px] text-white ring-2 ring-white ${
              isAnimating ? 'animate-pop' : ''
            }`}
          >
            {badgeLabel}
          </span>
        )}
      </div>
    </>
  )
}

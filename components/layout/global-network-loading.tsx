'use client'

import { useEffect, useState } from 'react'
import { useNetworkLoadingStore } from '@/store/use-network-loading-store'

const FETCH_PATCH_KEY = '__yesnas_fetch_patched__'
const DRAWER_OPEN_COUNT_KEY = '__yesnas_side_drawer_open_count__'

export function GlobalNetworkLoading() {
  const pendingCount = useNetworkLoadingStore((state) => state.pendingCount)
  const begin = useNetworkLoadingStore((state) => state.begin)
  const end = useNetworkLoadingStore((state) => state.end)
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const globalWithFlag = window as Window & {
      [FETCH_PATCH_KEY]?: boolean
    }
    if (globalWithFlag[FETCH_PATCH_KEY]) return
    globalWithFlag[FETCH_PATCH_KEY] = true

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const drawerOpenCount =
        Number(
          (window as Window & { [DRAWER_OPEN_COUNT_KEY]?: number })[
            DRAWER_OPEN_COUNT_KEY
          ] ?? 0,
        ) || 0

      if (drawerOpenCount > 0) {
        return originalFetch(...args)
      }

      begin()
      try {
        return await originalFetch(...args)
      } finally {
        end()
      }
    }
  }, [begin, end])

  useEffect(() => {
    if (pendingCount > 0) {
      setVisible(true)
      setProgress((prev) => (prev < 15 ? 15 : prev))
      return
    }
    if (!visible) return
    setProgress(100)
    const timer = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 240)
    return () => window.clearTimeout(timer)
  }, [pendingCount, visible])

  useEffect(() => {
    if (pendingCount <= 0) return
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev
        return prev + Math.max(1, Math.round((92 - prev) * 0.12))
      })
    }, 180)
    return () => window.clearInterval(timer)
  }, [pendingCount])

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-9999 h-0.5 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div
        className="bg-app-text-sub h-full transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

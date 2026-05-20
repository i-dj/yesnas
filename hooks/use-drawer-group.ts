'use client'

import { useCallback, useMemo, useState } from 'react'

type DrawerPayloadMap<DrawerKey extends string> = Partial<
  Record<DrawerKey, unknown>
>

export function useDrawerGroup<const DrawerKey extends string>(
  drawerKeys: readonly DrawerKey[],
) {
  const [activeKey, setActiveKey] = useState<DrawerKey | null>(null)
  const [payloadMap, setPayloadMap] = useState<DrawerPayloadMap<DrawerKey>>({})

  const isOpen = useCallback(
    (key: DrawerKey) => activeKey === key,
    [activeKey],
  )

  const open = useCallback(
    <Payload = unknown>(key: DrawerKey, payload?: Payload) => {
      setActiveKey(key)
      if (payload === undefined) return
      setPayloadMap((prev) => ({ ...prev, [key]: payload }))
    },
    [],
  )

  const close = useCallback((key?: DrawerKey) => {
    setActiveKey((prev) => {
      if (!key) return null
      return prev === key ? null : prev
    })
  }, [])

  const closeAll = useCallback(() => setActiveKey(null), [])

  const clearPayload = useCallback((key: DrawerKey) => {
    setPayloadMap((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const getPayload = useCallback(
    <Payload = unknown>(key: DrawerKey): Payload | undefined =>
      payloadMap[key] as Payload | undefined,
    [payloadMap],
  )

  const openMap = useMemo(
    () =>
      Object.fromEntries(
        drawerKeys.map((key) => [key, activeKey === key]),
      ) as Record<DrawerKey, boolean>,
    [activeKey, drawerKeys],
  )

  return {
    activeKey,
    openMap,
    isOpen,
    open,
    close,
    closeAll,
    getPayload,
    clearPayload,
  }
}


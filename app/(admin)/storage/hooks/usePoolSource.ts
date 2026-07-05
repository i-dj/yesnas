'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import type { PoolSource } from '../types'
import { poolSourceValues } from '../types'

export const getPoolSourceHref = (source: PoolSource) => `/storage?source=${source}`

const readPoolSourceFromURL = (): PoolSource => {
  const params = new URLSearchParams(window.location.search)
  const source = params.get('source')
  return poolSourceValues.includes(source as PoolSource) ? (source as PoolSource) : 'local'
}

export function usePoolSource(initialPoolSource: PoolSource) {
  const [poolSource, setPoolSource] = useState<PoolSource>(initialPoolSource)

  useEffect(() => {
    setPoolSource(initialPoolSource)
  }, [initialPoolSource])

  useEffect(() => {
    const syncPoolSourceFromURL = () => setPoolSource(readPoolSourceFromURL())

    window.addEventListener('popstate', syncPoolSourceFromURL)

    return () => {
      window.removeEventListener('popstate', syncPoolSourceFromURL)
    }
  }, [])

  const changePoolSource = useCallback((nextSource: PoolSource, mode: 'push' | 'replace' = 'push') => {
    setPoolSource(nextSource)
    const href = getPoolSourceHref(nextSource)
    if (mode === 'replace') {
      window.history.replaceState(null, '', href)
      return
    }
    window.history.pushState(null, '', href)
  }, [])

  const handlePoolSourceAnchorClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, nextSource: PoolSource) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      event.preventDefault()
      changePoolSource(nextSource)
    },
    [changePoolSource],
  )

  return {
    poolSource,
    changePoolSource,
    handlePoolSourceAnchorClick,
  }
}

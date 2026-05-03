import { SORT_DIRECTIONS, SortConfig, SortDirection } from '@/types'
import { useState, useCallback } from 'react'

export function useSort<T>(
  initialKey: keyof T,
  initialDir: SortDirection = SORT_DIRECTIONS.ASC,
) {
  const [sort, setSort] = useState<SortConfig<T>>({
    key: initialKey,
    dir: initialDir,
  })

  const handleSort = useCallback((key: keyof T) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, dir: SORT_DIRECTIONS.ASC }
      }

      let nextDir: SortDirection = SORT_DIRECTIONS.ASC

      if (prev.dir === SORT_DIRECTIONS.ASC) {
        nextDir = SORT_DIRECTIONS.DESC
      } else if (prev.dir === SORT_DIRECTIONS.DESC) {
        nextDir = null
      } else {
        nextDir = SORT_DIRECTIONS.ASC
      }

      return { key, dir: nextDir }
    })
  }, [])

  return { sort, handleSort, setSort }
}

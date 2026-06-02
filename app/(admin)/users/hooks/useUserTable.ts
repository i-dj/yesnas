import { useMemo, useState, useEffect } from 'react'
import type { User } from '@/types'
import { performSort } from '@/lib/utils'
import { SORT_DIRECTIONS } from '@/types'
import { useSort } from '@/hooks/use-sort'

export function useUserTable(users: User[]) {
  const [list, setList] = useState(users)
  const [keyword, setKeyword] = useState('')

  const { sort, handleSort } = useSort<User>('updatedAt', SORT_DIRECTIONS.DESC)

  useEffect(() => {
    setList(users)
  }, [users])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return list

    return list.filter((u) => [u.username, u.displayName].some((v) => v?.toLowerCase().includes(q)))
  }, [keyword, list])

  const finalUsers = useMemo(() => {
    return sort.dir ? performSort(filtered, sort.key, sort.dir) : filtered
  }, [filtered, sort])

  return {
    list: finalUsers,
    keyword,
    setKeyword,
    sort,
    handleSort,
  }
}

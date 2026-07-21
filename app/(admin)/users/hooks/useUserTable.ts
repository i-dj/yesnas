import { useMemo, useState, useEffect } from 'react'
import type { User } from '@/types'
import { performSort } from '@/lib/utils'
import { SORT_DIRECTIONS } from '@/types'
import { useSort } from '@/hooks/use-sort'

export type UserStatusFilter = 'all' | 'enabled' | 'disabled' | 'admin'

export function useUserTable(users: User[]) {
  const [list, setList] = useState(users)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')

  const { sort, handleSort } = useSort<User>('updatedAt', SORT_DIRECTIONS.DESC)

  useEffect(() => {
    setList(users)
  }, [users])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const statusFiltered = list.filter((user) => {
      if (statusFilter === 'admin') return user.isAdmin
      if (statusFilter === 'enabled' || statusFilter === 'disabled') return user.status === statusFilter
      return true
    })

    if (!q) return statusFiltered
    return statusFiltered.filter((u) =>
      [u.username, u.displayName, ...(u.groups ?? []).map((group) => group.name)].some((v) =>
        v?.toLowerCase().includes(q),
      ),
    )
  }, [keyword, list, statusFilter])

  const finalUsers = useMemo(() => {
    return sort.dir ? performSort(filtered, sort.key, sort.dir) : filtered
  }, [filtered, sort])

  return {
    list: finalUsers,
    keyword,
    setKeyword,
    statusFilter,
    setStatusFilter,
    sort,
    handleSort,
  }
}

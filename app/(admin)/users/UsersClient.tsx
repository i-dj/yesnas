'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, EmptyState, Input, SectionTitle } from '@/components/ui'
import { useSort } from '@/hooks/use-sort'
import { createUser, deleteUser, updateUser } from '@/lib/server/file-service'
import { performSort } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import { SORT_DIRECTIONS, type UpdateUserPayload, type User } from '@/types'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { UserFormDrawer } from './_components/user-form-drawer'
import { getUserColumns } from './_columns/user-columns'
import type { UserFormState } from './_types'

interface UsersClientProps {
  users: User[]
  timeZone: string
}

export function UsersClient({ users, timeZone }: UsersClientProps) {
  const t = useTranslations('Users')
  const router = useRouter()
  const [userList, setUserList] = useState(users)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const { sort, handleSort } = useSort<User>('updatedAt', SORT_DIRECTIONS.DESC)

  useEffect(() => {
    setUserList(users)
  }, [users])

  const openCreate = () => {
    setEditingUser(null)
    setDrawerOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setDrawerOpen(true)
  }

  const handleSubmit = async (form: UserFormState) => {
    setSubmitting(true)
    try {
      const saved = editingUser ? await updateUser(editingUser.id, getUpdatePayload(form)) : await createUser(form)
      setUserList((current) =>
        editingUser ? current.map((user) => (user.id === saved.id ? saved : user)) : [saved, ...current],
      )
      setDrawerOpen(false)
      toast.success(editingUser ? t('messages.updated') : t('messages.created'))
      router.refresh()
    } catch (err) {
      const message = getUserErrorMessage(err, t('messages.saveFailed'), t)
      toast.error(t('messages.saveFailed'), message, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteConfirm = (user: User) => {
    const adminCount = userList.filter((item) => item.isAdmin).length
    if (user.isAdmin && adminCount <= 1) {
      toast.error(t('messages.deleteFailed'), t('messages.lastAdminDeleteBlocked'), 5000)
      return
    }

    setDeletingUser(user)
  }

  const handleDelete = async () => {
    if (!deletingUser) return

    setDeleting(true)
    try {
      await deleteUser(deletingUser.id)
      setUserList((current) => current.filter((item) => item.id !== deletingUser.id))
      setDeletingUser(null)
      toast.success(t('messages.deleted'))
      router.refresh()
    } catch (err) {
      const message = getUserErrorMessage(err, t('messages.deleteFailed'), t)
      toast.error(t('messages.deleteFailed'), message, 5000)
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(
    () =>
      getUserColumns({
        t,
        timeZone,
        onEdit: openEdit,
        onDelete: openDeleteConfirm,
      }),
    [t, timeZone, userList],
  )

  const filteredUsers = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return userList

    return userList.filter((user) =>
      [user.username, user.displayName].some((value) => value?.toLowerCase().includes(query)),
    )
  }, [keyword, userList])

  const finalUsers = useMemo(() => {
    return sort.dir ? performSort(filteredUsers, sort.key, sort.dir) : filteredUsers
  }, [filteredUsers, sort])

  return (
    <PageWrapper className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title={t('title')} subTitle={t('subtitle')} />
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-app-text-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              value={keyword}
              placeholder={t('searchPlaceholder')}
              className="w-56 pl-8"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <Button size="sm" icon={Plus} onClick={openCreate}>
            {t('actions.create')}
          </Button>
        </div>
      </div>

      <DataTable
        headers={columns}
        data={finalUsers}
        sortConfig={sort}
        onSortAction={handleSort}
        variant="primary"
      />
      {finalUsers.length === 0 ? <EmptyState message={keyword ? t('emptySearch') : t('empty')} /> : null}

      <UserFormDrawer
        open={drawerOpen}
        editingUser={editingUser}
        submitting={submitting}
        onOpenChange={setDrawerOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null)
        }}
        title={t('deleteConfirm.title')}
        description={t('deleteConfirm.description', {
          name: deletingUser?.displayName || deletingUser?.username || '',
        })}
        confirmText={t('actions.delete')}
        cancelText={t('actions.cancel')}
        loading={deleting}
        onConfirm={handleDelete}
      />
    </PageWrapper>
  )
}

function getUpdatePayload(form: UserFormState): UpdateUserPayload {
  return {
    displayName: form.displayName,
    isAdmin: form.isAdmin,
    avatar: form.avatar,
    status: form.status,
    ...(form.password ? { password: form.password } : {}),
  }
}

function getUserErrorMessage(error: unknown, fallback: string, t: ReturnType<typeof useTranslations>) {
  const message = error instanceof Error ? error.message : fallback
  const enableMatch = message.match(/enable samba user ([^:]+): run command .*smbpasswd -e/i)
  if (enableMatch) return t('messages.enableSmbFailed', { username: enableMatch[1] })

  const disableMatch = message.match(/disable samba user ([^:]+): run command .*smbpasswd -d/i)
  if (disableMatch) return t('messages.disableSmbFailed', { username: disableMatch[1] })

  if (/run command .*exit status/i.test(message)) return t('messages.systemCommandFailed')
  return message
}

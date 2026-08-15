'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, EmptyState, Pagination, SearchInput } from '@/components/ui'
import { groupApi } from '@/lib/api/user.api'
import { toast } from '@/store/use-toast-store'
import { type Group, type User } from '@/types'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { UserFormDrawer } from './components/user-form-drawer'
import { getUserColumns } from './components/user-columns'
import { UserGroupTabs } from './components/user-group-tabs'
import { UserOverview } from './components/user-overview'

import { useUserModal } from './hooks/useUserModal'
import { useUserTable } from './hooks/useUserTable'
import { useUserActions } from './hooks/useUserActions'

interface UsersClientProps {
  users: User[]
  groups: Group[]
  timeZone: string
  now?: string
}

export function UsersClient({ users, groups, timeZone, now }: UsersClientProps) {
  const t = useTranslations('Users')
  const locale = useLocale()
  const router = useRouter()
  const modal = useUserModal()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null)
  const [renameGroupName, setRenameGroupName] = useState('')
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null)
  const [groupLoading, setGroupLoading] = useState<'create' | 'update' | 'delete' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const scopedUsers = useMemo(() => {
    if (!selectedGroupId) return users
    return users.filter((user) => user.groups?.some((group) => group.id === selectedGroupId))
  }, [selectedGroupId, users])
  const table = useUserTable(scopedUsers)
  const groupTab = selectedGroupId ?? 'all'

  const actions = useUserActions({
    modal: modal.state,
    t,
    router,
    onSuccess: () => router.refresh(),
    onClose: modal.close,
  })

  const columns = useMemo(
    () =>
      getUserColumns({
        t,
        timeZone,
        now,
        locale,
        onEdit: modal.openEdit,
        onDelete: modal.openDelete,
      }),
    [locale, now, t, timeZone],
  )

  const handleDelete = async () => await actions.remove()
  const cancelCreateGroup = () => {
    setCreatingGroup(false)
    setNewGroupName('')
  }

  const cancelRenameGroup = () => {
    setRenamingGroupId(null)
    setRenameGroupName('')
  }

  const startRenameGroup = (group: Group) => {
    setRenamingGroupId(group.id)
    setRenameGroupName(group.name)
  }

  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name || groupLoading) return

    setGroupLoading('create')
    try {
      await groupApi.create({ name, description: '' })
      toast.success(t('groups.created'))
      cancelCreateGroup()
      router.refresh()
    } catch (error) {
      toast.error(`${t('groups.saveFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
    } finally {
      setGroupLoading(null)
    }
  }
  const handleGroupDelete = async () => {
    if (!deletingGroup) return
    setGroupLoading('delete')
    try {
      await groupApi.remove(deletingGroup.id)
      toast.success(t('groups.deleted'))
      if (selectedGroupId === deletingGroup.id) setSelectedGroupId(null)
      if (renamingGroupId === deletingGroup.id) cancelRenameGroup()
      setDeletingGroup(null)
      router.refresh()
    } catch (error) {
      toast.error(`${t('groups.deleteFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
    } finally {
      setGroupLoading(null)
    }
  }

  const handleGroupUpdate = async () => {
    const group = selectedGroupId ? groups.find((item) => item.id === selectedGroupId) : null
    const name = renameGroupName.trim()
    if (!group || !name || groupLoading) return

    setGroupLoading('update')
    try {
      await groupApi.update(group.id, { name, description: group.description || '' })
      toast.success(t('groups.updated'))
      cancelRenameGroup()
      router.refresh()
    } catch (error) {
      toast.error(`${t('groups.saveFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
    } finally {
      setGroupLoading(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(table.list.length / pageSize))
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return table.list.slice(start, start + pageSize)
  }, [page, pageSize, table.list])

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [selectedGroupId, table.keyword, pageSize])

  const handleGroupTabChange = (value: string) => {
    if (value === '__create__') {
      setCreatingGroup(true)
      return
    }
    setSelectedGroupId(value === 'all' ? null : value)
    setRenamingGroupId(null)
    setRenameGroupName('')
  }

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="app-page-title text-app-text flex items-center gap-2">{t('title')}</div>
          <p className="text-app-text-muted mt-1 text-sm">{t('subtitle')}</p>
        </div>

        <Button icon={Plus} onClick={() => modal.openCreate()}>
          {t('actions.create')}
        </Button>
      </div>

      <UserOverview users={users} />

      <section className="mt-5 min-h-[calc(100vh-17rem)]">
        <div className="mb-4 flex flex-col gap-4">
          <UserGroupTabs
            groups={groups}
            totalUsers={users.length}
            value={groupTab}
            creating={creatingGroup}
            newGroupName={newGroupName}
            renamingGroupId={renamingGroupId}
            renameGroupName={renameGroupName}
            loading={groupLoading}
            saveLabel={t('actions.save')}
            cancelLabel={t('actions.cancel')}
            onChange={handleGroupTabChange}
            onCreateNameChange={setNewGroupName}
            onCreate={handleCreateGroup}
            onCancelCreate={cancelCreateGroup}
            onRenameNameChange={setRenameGroupName}
            onStartRename={startRenameGroup}
            onSaveRename={handleGroupUpdate}
            onCancelRename={cancelRenameGroup}
            onDelete={setDeletingGroup}
          />

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <SearchInput
              wrapperClassName="w-full sm:w-80 border border-app-border/60 hover:border-app-border focus:border-app-border"
              className="h-9 rounded-lg border bg-transparent shadow-none hover:bg-transparent focus:bg-transparent"
              value={table.keyword}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => table.setKeyword(event.target.value)}
            />
          </div>
        </div>

        <div className="min-w-0">
          {table.list.length ? (
            <section className="min-h-0">
              <DataTable
                headers={columns}
                data={pagedUsers}
                sortConfig={table.sort}
                onSortAction={table.handleSort}
                variant="plain"
                headerClassName="text-app-text text-sm"
                tdClassName="rounded-none py-2.5"
                getRowClassName={() => '[&>td]:rounded-none'}
              />
              <div className="border-app-border  flex items-center justify-end border-t pt-3">
                <Pagination
                  id="users-page-size"
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 50]}
                  onPageChange={setPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize)
                    setPage(1)
                  }}
                />
              </div>
            </section>
          ) : (
            <EmptyState message={table.keyword ? t('emptySearch') : t('empty')} />
          )}
        </div>
      </section>

      <UserFormDrawer
        open={modal.state.drawerOpen}
        editingUser={modal.state.user}
        groups={groups}
        submitting={actions.loading === 'submit'}
        onOpenChange={(open) => {
          if (!open) modal.close()
        }}
        onSubmit={actions.submit}
      />

      <ConfirmModal
        open={modal.state.mode === 'delete'}
        onOpenChange={(open) => {
          if (!open) modal.close()
        }}
        title={t('deleteConfirm.title')}
        description={t('deleteConfirm.description', {
          name: modal.state.user?.displayName || modal.state.user?.username || '',
        })}
        confirmText={t('actions.delete')}
        cancelText={t('actions.cancel')}
        loading={actions.loading === 'delete'}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={Boolean(deletingGroup)}
        onOpenChange={(open) => {
          if (!open) setDeletingGroup(null)
        }}
        title={t('groups.deleteTitle')}
        description={t('groups.deleteDescription', { name: deletingGroup?.name ?? '' })}
        confirmText={t('actions.delete')}
        cancelText={t('actions.cancel')}
        loading={groupLoading === 'delete'}
        onConfirm={handleGroupDelete}
      />
    </PageWrapper>
  )
}

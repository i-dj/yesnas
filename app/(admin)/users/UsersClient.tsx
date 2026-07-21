'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, EmptyState, Input, Pill, SearchInput } from '@/components/ui'
import { groupApi } from '@/lib/api/user.api'
import { toast } from '@/store/use-toast-store'
import { type Group, type User } from '@/types'
import { Check, Edit3, Plus, Trash2, UserRound, UsersRound, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { UserFormDrawer } from './components/user-form-drawer'
import { getUserColumns } from './components/user-columns'
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

  const scopedUsers = useMemo(() => {
    if (!selectedGroupId) return users
    return users.filter((user) => user.groups?.some((group) => group.id === selectedGroupId))
  }, [selectedGroupId, users])
  const table = useUserTable(scopedUsers)
  const selectedGroup = selectedGroupId ? groups.find((group) => group.id === selectedGroupId) || null : null

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
  const handleCreateGroup = async () => {
    const name = newGroupName.trim()
    if (!name || groupLoading) return

    setGroupLoading('create')
    try {
      await groupApi.create({ name, description: '' })
      toast.success(t('groups.created'))
      setCreatingGroup(false)
      setNewGroupName('')
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
      if (renamingGroupId === deletingGroup.id) {
        setRenamingGroupId(null)
        setRenameGroupName('')
      }
      setDeletingGroup(null)
      router.refresh()
    } catch (error) {
      toast.error(`${t('groups.deleteFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
    } finally {
      setGroupLoading(null)
    }
  }

  const handleGroupUpdate = async () => {
    const group = selectedGroup
    const name = renameGroupName.trim()
    if (!group || !name || groupLoading) return

    setGroupLoading('update')
    try {
      await groupApi.update(group.id, { name, description: group.description || '' })
      toast.success(t('groups.updated'))
      setRenamingGroupId(null)
      setRenameGroupName('')
      router.refresh()
    } catch (error) {
      toast.error(`${t('groups.saveFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
    } finally {
      setGroupLoading(null)
    }
  }

  const selectedGroupTitle = selectedGroup?.name || '全部用户'
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Pill
            onClick={() => {
              setSelectedGroupId(null)
              setRenamingGroupId(null)
              setRenameGroupName('')
            }}
            icon={UserRound}
            selected={!selectedGroupId}
            count={users.length}
          >
            全部用户
          </Pill>

          {groups.map((group) => {
            const selected = selectedGroupId === group.id
            return (
              <Pill
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id)
                  setRenamingGroupId(null)
                  setRenameGroupName('')
                }}
                selected={selected}
                count={group.userCount}
                contentClassName="max-w-32"
              >
                {group.name}
              </Pill>
            )
          })}

          {creatingGroup ? (
            <Pill rawContent variant="plain" className="gap-1 px-2">
              <Input
                value={newGroupName}
                autoFocus
                placeholder="新增用户组"
                clearable={false}
                wrapperClassName="w-32"
                className="h-6 rounded-full border-transparent bg-transparent px-1 text-sm hover:bg-transparent focus:border-transparent focus:bg-transparent"
                onChange={(event) => setNewGroupName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleCreateGroup()
                  }
                  if (event.key === 'Escape') {
                    setCreatingGroup(false)
                    setNewGroupName('')
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={Check}
                loading={groupLoading === 'create'}
                disabled={!newGroupName.trim() || groupLoading === 'create'}
                onClick={handleCreateGroup}
              />
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={X}
                onClick={() => {
                  setCreatingGroup(false)
                  setNewGroupName('')
                }}
              />
            </Pill>
          ) : (
            <Pill icon={Plus} onClick={() => setCreatingGroup(true)}>
              新增
            </Pill>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="flex min-w-0 items-center gap-1.5">
                {selectedGroup && renamingGroupId === selectedGroup.id ? (
                  <Pill rawContent variant="plain" className="gap-1 px-2">
                    <UsersRound className="text-app-text-muted size-3.5 shrink-0" />
                    <Input
                      value={renameGroupName}
                      autoFocus
                      clearable={false}
                      wrapperClassName="w-56"
                      className="h-6 rounded-full border-transparent bg-transparent px-1 text-sm font-normal hover:bg-transparent focus:border-transparent focus:bg-transparent"
                      onChange={(event) => setRenameGroupName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleGroupUpdate()
                        }
                        if (event.key === 'Escape') {
                          setRenamingGroupId(null)
                          setRenameGroupName('')
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={Check}
                      loading={groupLoading === 'update'}
                      disabled={!renameGroupName.trim() || groupLoading === 'update'}
                      tip={t('actions.save')}
                      onClick={handleGroupUpdate}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      icon={X}
                      tip={t('actions.cancel')}
                      onClick={() => {
                        setRenamingGroupId(null)
                        setRenameGroupName('')
                      }}
                    />
                  </Pill>
                ) : (
                  <div className="text-app-text flex min-w-0 items-center gap-2 truncate text-base font-semibold">
                    {selectedGroup ? (
                      <UsersRound className="text-app-text-muted size-4 shrink-0" />
                    ) : (
                      <UserRound className="text-app-text-muted size-4 shrink-0" />
                    )}
                    <span className="truncate">{selectedGroupTitle}</span>
                  </div>
                )}

                {selectedGroup && renamingGroupId !== selectedGroup.id ? (
                  <div className="flex">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      tip="修改组名称"
                      onClick={() => {
                        setRenamingGroupId(selectedGroup.id)
                        setRenameGroupName(selectedGroup.name)
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      isDelete
                      className="text-red-400 hover:text-red-400"
                      tip="解散组"
                      onClick={() => setDeletingGroup(selectedGroup)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <SearchInput
              wrapperClassName="w-64 max-w-full"
              value={table.keyword}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => table.setKeyword(event.target.value)}
            />
          </div>

          {table.list.length ? (
            <DataTable
              headers={columns}
              data={table.list}
              sortConfig={table.sort}
              onSortAction={table.handleSort}
              variant="plain"
              showHeader={false}
              className="[&_.app-body-text]:text-xs"
            />
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

'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, EmptyState, Input, ToggleButton } from '@/components/ui'
import { type User } from '@/types'
import { Plus, Search, UsersRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { UserFormDrawer } from './components/user-form-drawer'
import { getUserColumns } from './components/user-columns'
import { UserOverview } from './components/user-overview'

import { useUserModal } from './hooks/useUserModal'
import { useUserTable } from './hooks/useUserTable'
import { useUserActions } from './hooks/useUserActions'

interface UsersClientProps {
  users: User[]
  timeZone: string
}

export function UsersClient({ users, timeZone }: UsersClientProps) {
  const t = useTranslations('Users')
  const router = useRouter()
  const modal = useUserModal()
  const table = useUserTable(users)

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
        onEdit: modal.openEdit,
        onDelete: modal.openDelete,
      }),
    [t, timeZone, users],
  )

  const handleDelete = async () => await actions.remove()
  const statusFilters = [
    { value: 'all', text: t('filters.all'), count: users.length },
    { value: 'enabled', text: t('filters.enabled'), count: users.filter((user) => user.status === 'enabled').length },
    {
      value: 'disabled',
      text: t('filters.disabled'),
      count: users.filter((user) => user.status === 'disabled').length,
    },
    { value: 'admin', text: t('filters.admins'), count: users.filter((user) => user.isAdmin).length },
  ] as const
  const statusTabs = statusFilters.map((filter) => ({
    value: filter.value,
    label: (
      <span className="inline-flex items-center gap-2.5">
        <span>{filter.text}</span>
        <span
          className={`app-micro-label grid h-5 min-w-5 place-items-center rounded-full px-1.5 ${
            table.statusFilter === filter.value ? 'bg-app-bg/80 text-app-text' : 'bg-app-active text-app-text-muted'
          }`}
        >
          {filter.count}
        </span>
      </span>
    ),
  }))

  return (
    <PageWrapper className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="app-page-title text-app-text flex items-center gap-2">
            <UsersRound className="size-5 text-sky-400" />
            {t('title')}
          </div>
          <p className="app-body-text text-app-text-muted mt-1">{t('subtitle')}</p>
        </div>

        <Button size="sm" icon={Plus} onClick={modal.openCreate}>
          {t('actions.create')}
        </Button>
      </div>

      <UserOverview users={users} />

      <section className="min-h-0 overflow-hidden">
        <div className="border-app-border/50 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="min-w-0 overflow-x-auto">
            <ToggleButton
              items={statusTabs}
              value={table.statusFilter}
              onChange={table.setStatusFilter}
              showSeparator={false}
              shape="rounded"
              className="h-8 border-none bg-transparent"
              itemClassName="px-2.5"
            />
          </div>

          <div className="relative w-64 max-w-full">
            <Search className="text-app-text-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              value={table.keyword}
              placeholder={t('searchPlaceholder')}
              className="bg-transparent pl-8"
              onChange={(e) => table.setKeyword(e.target.value)}
            />
          </div>
        </div>

        {table.list.length ? (
          <DataTable
            headers={columns}
            data={table.list}
            sortConfig={table.sort}
            onSortAction={table.handleSort}
            variant="plain"
          />
        ) : (
          <EmptyState message={table.keyword ? t('emptySearch') : t('empty')} className="border-none bg-transparent" />
        )}
      </section>

      <UserFormDrawer
        open={modal.state.drawerOpen}
        editingUser={modal.state.user}
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
    </PageWrapper>
  )
}

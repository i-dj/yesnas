'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button, ConfirmModal, DataTable, EmptyState, Input, SectionTitle } from '@/components/ui'
import { type User } from '@/types'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { UserFormDrawer } from './components/user-form-drawer'
import { getUserColumns } from './components/user-columns'

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

  return (
    <PageWrapper className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title={t('title')} subTitle={t('subtitle')} />

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="text-app-text-muted pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
            <Input
              value={table.keyword}
              placeholder={t('searchPlaceholder')}
              className="w-56 pl-8"
              onChange={(e) => table.setKeyword(e.target.value)}
            />
          </div>

          <Button size="sm" icon={Plus} onClick={modal.openCreate}>
            {t('actions.create')}
          </Button>
        </div>
      </div>

      <DataTable
        headers={columns}
        data={table.list}
        sortConfig={table.sort}
        onSortAction={table.handleSort}
        variant="primary"
      />

      {table.list.length === 0 && <EmptyState message={table.keyword ? t('emptySearch') : t('empty')} />}

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
        onConfirm={handleDelete}
      />
    </PageWrapper>
  )
}

'use client'

import { ActionMenu, Button, Input, ScrollableToggleBar, ToggleButton } from '@/components/ui'
import type { Group } from '@/types'
import { Check, Edit3, MoreHorizontal, Plus, Trash2, UserRound, UsersRound, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface UserGroupTabsProps {
  groups: Group[]
  totalUsers: number
  value: string
  creating: boolean
  newGroupName: string
  renamingGroupId: string | null
  renameGroupName: string
  loading: 'create' | 'update' | 'delete' | null
  saveLabel: string
  cancelLabel: string
  onChange: (value: string) => void
  onCreateNameChange: (name: string) => void
  onCreate: () => void
  onCancelCreate: () => void
  onRenameNameChange: (name: string) => void
  onStartRename: (group: Group) => void
  onSaveRename: () => void
  onCancelRename: () => void
  onDelete: (group: Group) => void
}

export function UserGroupTabs({
  groups,
  totalUsers,
  value,
  creating,
  newGroupName,
  renamingGroupId,
  renameGroupName,
  loading,
  saveLabel,
  cancelLabel,
  onChange,
  onCreateNameChange,
  onCreate,
  onCancelCreate,
  onRenameNameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
}: UserGroupTabsProps) {
  const items = [
    {
      value: 'all',
      label: '全部用户',
      icon: UserRound,
      badge: totalUsers,
    },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name,
      icon: UsersRound,
      badge: group.userCount,
      render: ({ selected, defaultContent }: { selected: boolean; defaultContent: ReactNode }) =>
        selected && renamingGroupId === group.id ? (
          <>
            <UsersRound className="size-4 shrink-0" />
            <Input
              value={renameGroupName}
              autoFocus
              clearable={false}
              wrapperClassName="w-40"
              className="h-7 rounded-md border-transparent bg-transparent px-1 text-sm font-normal hover:bg-transparent focus:border-transparent focus:bg-transparent"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onRenameNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onSaveRename()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  onCancelRename()
                }
              }}
            />
          </>
        ) : (
          defaultContent
        ),
      trailing: ({ selected }: { selected: boolean }) => (
        <div
          className={`flex h-full shrink-0 items-center justify-center ${
            selected ? '' : 'pointer-events-none invisible'
          } ${renamingGroupId === group.id ? 'w-14' : 'w-7'}`}
        >
          {renamingGroupId === group.id ? (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                icon={Check}
                loading={loading === 'update'}
                disabled={!renameGroupName.trim() || loading === 'update'}
                tip={saveLabel}
                onClick={onSaveRename}
              />
              <Button type="button" variant="ghost" size="xs" icon={X} tip={cancelLabel} onClick={onCancelRename} />
            </div>
          ) : (
            <ActionMenu
              mode="left-click"
              align="start"
              onAction={(action) => {
                if (action === 'rename') onStartRename(group)
                if (action === 'delete') onDelete(group)
              }}
              items={[
                { label: '修改组名称', action: 'rename', icon: Edit3 },
                { label: '删除组', action: 'delete', icon: Trash2, isDelete: true  },
              ]}
              trigger={<Button variant="ghost" size="xs" icon={MoreHorizontal} tip="组操作" />}
            />
          )}
        </div>
      ),
    })),
    {
      value: '__create__',
      label: '新增',
      icon: Plus,
    },
  ]

  return (
    <ScrollableToggleBar className="border-app-border/70 border-b" contentClassName="gap-3">
      <ToggleButton
        items={items}
        value={value}
        onChange={onChange}
        variant="segmented"
        className="h-11 w-max min-w-max gap-2 border-b-0"
        itemClassName="px-1 sm:px-1.5"
        activeIndicatorClassName="bottom-0 z-10 h-px "
      />
      {creating ? (
        <div className="flex h-11 shrink-0 items-center gap-1.5 px-1">
          <Plus className="text-app-text-muted size-3.5 shrink-0" />
          <Input
            value={newGroupName}
            autoFocus
            placeholder="新增用户组"
            clearable={false}
            wrapperClassName="w-36"
            className="h-7 rounded-md border-transparent bg-transparent px-1 text-sm hover:bg-transparent focus:border-transparent focus:bg-transparent"
            onChange={(event) => onCreateNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onCreate()
              }
              if (event.key === 'Escape') onCancelCreate()
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            icon={Check}
            loading={loading === 'create'}
            disabled={!newGroupName.trim() || loading === 'create'}
            onClick={onCreate}
          />
          <Button type="button" variant="ghost" size="xs" icon={X} onClick={onCancelCreate} />
        </div>
      ) : null}
    </ScrollableToggleBar>
  )
}

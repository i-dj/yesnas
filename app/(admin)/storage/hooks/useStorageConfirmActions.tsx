'use client'

import { useState, type MutableRefObject } from 'react'
import { Checkbox, Input } from '@/components/ui'
import { useConfirmModal } from '@/hooks/use-confirm-modal'
import { toast } from '@/store/use-toast-store'
import type { StoragePoolModel } from '@/types/models/storage'
import type { SnapshotPayload, useStorageActions } from './useStorageActions'

type StorageActions = ReturnType<typeof useStorageActions>

interface PasswordFieldProps {
  passwordRef: MutableRefObject<string>
  placeholder?: string
}

function PasswordField({ passwordRef, placeholder = 'Admin password' }: PasswordFieldProps) {
  const [password, setPassword] = useState('')

  return (
    <div className="px-6">
      <Input
        type="password"
        value={password}
        onChange={(event) => {
          passwordRef.current = event.target.value
          setPassword(event.target.value)
        }}
        placeholder={placeholder}
      />
    </div>
  )
}

interface SnapshotFieldsProps {
  payloadRef: MutableRefObject<SnapshotPayload>
}

function SnapshotFields({ payloadRef }: SnapshotFieldsProps) {
  const [payload, setPayload] = useState<SnapshotPayload>(payloadRef.current)

  const updatePayload = (next: Partial<SnapshotPayload>) => {
    const updated = {
      ...payloadRef.current,
      ...next,
    }
    payloadRef.current = updated
    setPayload(updated)
  }

  return (
    <div className="space-y-2 px-6">
      <Input
        value={payload.name}
        onChange={(event) => updatePayload({ name: event.target.value })}
        placeholder="Snapshot name"
      />
      <Input
        value={payload.description ?? ''}
        onChange={(event) => updatePayload({ description: event.target.value })}
        placeholder="Description (optional)"
      />
      <Checkbox
        label="Read only"
        checked={payload.readOnly ?? true}
        onChange={(checked) => updatePayload({ readOnly: checked })}
        className="px-0"
      />
    </div>
  )
}

const createSnapshotName = () => `snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`

export function useStorageConfirmActions(storageActions: StorageActions) {
  const { confirm } = useConfirmModal()

  const confirmDeletePool = (pool: StoragePoolModel) => {
    const passwordRef = { current: '' }

    void confirm({
      title: 'Delete Storage Pool',
      description: (
        <>
          This action will permanently remove
          <strong className="px-2 text-red-400">{pool.name}</strong>, Enter admin password to continue.
        </>
      ),
      confirmText: 'Confirm Delete',
      focusFirstInput: true,
      children: <PasswordField passwordRef={passwordRef} placeholder="Admin password (123)" />,
      onConfirm: async () => {
        if (passwordRef.current !== '123') {
          toast.error('Delete pool failed: Invalid admin password.', 5000)
          throw new Error('Invalid admin password')
        }

        const ok = await storageActions.deletePool(pool.id, pool.name)
        if (!ok) throw new Error('Delete pool failed')
      },
    })
  }

  const confirmCreateSnapshot = (pool: StoragePoolModel) => {
    const payloadRef = {
      current: {
        name: createSnapshotName(),
        sourcePath: '',
        description: '',
        readOnly: true,
      } satisfies SnapshotPayload,
    }

    void confirm({
      title: 'Create Snapshot',
      description: `Create snapshot for ${pool.name}.`,
      confirmText: 'Create Snapshot',
      cancelText: 'Cancel',
      isDestructive: false,
      focusFirstInput: true,
      children: <SnapshotFields payloadRef={payloadRef} />,
      onConfirm: async () => {
        const ok = await storageActions.createSnapshot(pool, payloadRef.current)
        if (!ok) throw new Error('Create snapshot failed')
      },
    })
  }

  const confirmFormatPool = (pool: StoragePoolModel) => {
    const passwordRef = { current: '' }

    void confirm({
      title: 'Format Storage Pool',
      description: (
        <>
          This action will format
          <strong className="px-2 text-red-400">{pool.name}</strong>, Enter admin password to continue.
        </>
      ),
      confirmText: 'Format Pool',
      cancelText: 'Cancel',
      focusFirstInput: true,
      children: <PasswordField passwordRef={passwordRef} />,
      onConfirm: async () => {
        const ok = await storageActions.formatPool(pool, passwordRef.current)
        if (!ok) throw new Error('Format pool failed')
      },
    })
  }

  return {
    confirmDeletePool,
    confirmCreateSnapshot,
    confirmFormatPool,
  }
}

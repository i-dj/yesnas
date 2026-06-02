'use client'

import { useState } from 'react'
import type { StoragePoolModel } from '@/types/models/storage'

const initialQuickDeleteState = {
  poolId: '',
  poolName: '',
  password: '',
  error: null as string | null,
  deleting: false,
}

const initialSnapshotPayload = {
  name: '',
  sourcePath: '',
  description: '',
  readOnly: true,
}

const initialPoolActionState = {
  poolId: null as string | null,
  modal: {
    benchmark: false,
    createSnapshot: false,
    formatPool: false,
    deletePool: false,
  },
  submitting: false,
}

type PoolActionModalKey = keyof typeof initialPoolActionState.modal

const createSnapshotName = () => `snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`

export function useStorageModal() {
  const [creatorSession, setCreatorSession] = useState(0)
  const [quickDelete, setQuickDelete] = useState(initialQuickDeleteState)
  const [poolAction, setPoolAction] = useState(initialPoolActionState)
  const [snapshotPayload, setSnapshotPayload] = useState(initialSnapshotPayload)
  const [formatPassword, setFormatPassword] = useState('')

  const bumpCreatorSession = () => setCreatorSession((prev) => prev + 1)
  const setModalOpen = (modal: PoolActionModalKey, open: boolean) => {
    setPoolAction((prev) => ({
      ...prev,
      submitting: open ? prev.submitting : false,
      modal: { ...prev.modal, [modal]: open },
    }))
  }
  const openPoolModal = (pool: StoragePoolModel, modal: PoolActionModalKey) => {
    setPoolAction((prev) => ({
      ...prev,
      poolId: pool.id,
      submitting: false,
      modal: { ...prev.modal, [modal]: true },
    }))
  }

  const openDelete = (pool: StoragePoolModel) => {
    setQuickDelete({
      poolId: pool.id,
      poolName: pool.name,
      password: '',
      error: null,
      deleting: false,
    })
    setModalOpen('deletePool', true)
  }

  const closeDelete = () => {
    setQuickDelete(initialQuickDeleteState)
    setModalOpen('deletePool', false)
  }

  const setDeleteOpen = (open: boolean) => (open ? setModalOpen('deletePool', true) : closeDelete())
  const setDeletePassword = (password: string) =>
    setQuickDelete((prev) => ({
      ...prev,
      password,
      error: null,
    }))
  const setDeleting = (deleting: boolean, error: string | null = null) =>
    setQuickDelete((prev) => ({ ...prev, deleting, error }))

  const openBenchmark = (pool: StoragePoolModel) => {
    openPoolModal(pool, 'benchmark')
  }

  const setBenchmarkOpen = (open: boolean) => {
    setModalOpen('benchmark', open)
  }

  const openSnapshot = (pool: StoragePoolModel) => {
    openPoolModal(pool, 'createSnapshot')
    setSnapshotPayload({
      name: createSnapshotName(),
      sourcePath: '',
      description: '',
      readOnly: true,
    })
  }

  const setSnapshotOpen = (open: boolean) => {
    setModalOpen('createSnapshot', open)
    if (!open) {
      setSnapshotPayload(initialSnapshotPayload)
    }
  }

  const openFormat = (pool: StoragePoolModel) => {
    openPoolModal(pool, 'formatPool')
    setFormatPassword('')
  }

  const setFormatOpen = (open: boolean) => {
    setModalOpen('formatPool', open)
    if (!open) {
      setFormatPassword('')
    }
  }

  const setSubmitting = (submitting: boolean) => {
    setPoolAction((prev) => ({ ...prev, submitting }))
  }

  return {
    creatorSession,
    bumpCreatorSession,
    quickDelete,
    setDeleteOpen,
    setDeletePassword,
    setDeleting,
    poolAction,
    snapshotPayload,
    setSnapshotPayload,
    formatPassword,
    setFormatPassword,
    openDelete,
    closeDelete,
    openBenchmark,
    setBenchmarkOpen,
    openSnapshot,
    setSnapshotOpen,
    openFormat,
    setFormatOpen,
    setSubmitting,
  }
}

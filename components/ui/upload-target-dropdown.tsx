'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { StoragePoolModel } from '@/types/models/storage'
import { Button } from './button'
import { StorageLocationPicker, type StorageLocationValue } from './storage-location-picker'

export type UploadTargetValue = StorageLocationValue

interface UploadTargetDropdownProps {
  storagePools: StoragePoolModel[]
  value: UploadTargetValue
  onChange: (value: UploadTargetValue) => void
  onError?: (message: string | null) => void
}

const DEFAULT_UPLOAD_TARGET_KEY = 'yesnas.upload.default-target'

export function UploadTargetDropdown({ storagePools, value, onChange, onError }: UploadTargetDropdownProps) {
  const t = useTranslations('Upload')
  const defaultRawRef = useRef<UploadTargetValue | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEFAULT_UPLOAD_TARGET_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as UploadTargetValue & { storageId?: string }
      const storagePoolId = parsed.storagePoolId || parsed.storageId || ''
      if (!storagePoolId) return
      const normalized = {
        storagePoolId,
        folderId: parsed.folderId || '',
        pathNames: parsed.pathNames || [],
      }
      defaultRawRef.current = normalized
      onChange(normalized)
    } catch {
      defaultRawRef.current = null
    }
  }, [onChange])

  useEffect(() => {
    if (!value.storagePoolId || storagePools.length === 0) return
    const pool = storagePools.find((item) => item.id === value.storagePoolId || item.storageId === value.storagePoolId)
    if (pool) {
      if (pool.id !== value.storagePoolId) {
        const normalized = {
          storagePoolId: pool.id,
          folderId: value.folderId,
          pathNames: value.pathNames,
        }
        if (defaultRawRef.current?.storagePoolId === value.storagePoolId) {
          defaultRawRef.current = normalized
          window.localStorage.setItem(DEFAULT_UPLOAD_TARGET_KEY, JSON.stringify(normalized))
        }
        onChange(normalized)
      }
      return
    }
    onError?.(null)
    onChange({ storagePoolId: '', folderId: '', pathNames: [] })
  }, [onChange, onError, storagePools, value.folderId, value.pathNames, value.storagePoolId])

  const isSameAsDefault =
    defaultRawRef.current?.storagePoolId === value.storagePoolId &&
    (defaultRawRef.current?.folderId || '') === (value.folderId || '')
  const canSetDefault = Boolean(value.storagePoolId) && !isSameAsDefault

  return (
    <div className="bg-app-bg">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-app-text mb-2 text-xs font-semibold uppercase">{t('target')}</span>
      </div>

      <div className="relative flex items-center gap-2">
        <StorageLocationPicker
          storagePools={storagePools}
          value={value}
          onChange={onChange}
          onError={onError}
          allowCreateFolder
          placeholder={t('selectTarget')}
          className="min-w-0 flex-1"
          labels={{
            close: t('closeTargetPicker'),
            loadingFolders: t('loadingFolders'),
            noFolders: t('noFolders'),
            newFolderName: t('newFolderName'),
            folderCreated: t('folderCreated'),
            createFolderFailed: t('createFolderFailed'),
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-9"
          disabled={!canSetDefault}
          onClick={() => {
            if (!canSetDefault) return
            const payload: UploadTargetValue = {
              storagePoolId: value.storagePoolId,
              folderId: value.folderId,
              pathNames: value.pathNames,
            }
            window.localStorage.setItem(DEFAULT_UPLOAD_TARGET_KEY, JSON.stringify(payload))
            defaultRawRef.current = payload
          }}
        >
          {t('setDefault')}
        </Button>
      </div>
    </div>
  )
}

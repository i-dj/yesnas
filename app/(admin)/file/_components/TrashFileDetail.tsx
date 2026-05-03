'use client'

import type { FileNode } from '@nextdj/file-explorer'
import { formatDateTime } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface TrashFileDetailProps {
  file: FileNode
}

export const TrashFileDetail = ({ file }: TrashFileDetailProps) => {
  const t = useTranslations('File.trashDetail')

  return (
    <div className="space-y-3 py-1 text-sm">
      <div className="grid grid-cols-[88px_1fr] gap-x-3 gap-y-2">
        <span className="text-app-text-muted">{t('name')}</span>
        <span className="break-all">{file.name}</span>

        <span className="text-app-text-muted">{t('deletedAt')}</span>
        <span>{formatDateTime(file.metadata?.deletedAt)}</span>

        <span className="text-app-text-muted">{t('originalPath')}</span>
        <span className="break-all">{file.metadata?.originalPath ?? '--'}</span>

        <span className="text-app-text-muted">{t('recyclePath')}</span>
        <span className="break-all">{file.metadata?.recyclePath ?? '--'}</span>

        <span className="text-app-text-muted">{t('expiresAt')}</span>
        <span>{formatDateTime(file.metadata?.expiresAt)}</span>
      </div>
    </div>
  )
}

'use client'

import type { StorageDrive } from '@/types'
import {
  FileExplorer,
  type FileExplorerData,
  type FileNode,
} from '@nextdj/file-explorer'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

interface FilesClientProps {
  storage: StorageDrive
  initialData: FileExplorerData
}

export function FilesClient({ storage, initialData }: FilesClientProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  const navigateToFolder = (parentId?: string) => {
    const url = parentId
      ? `/file/${storage.id}?parentId=${encodeURIComponent(parentId)}`
      : `/file/${storage.id}`

    router.push(url)
  }

  const handleOpenFile = (file: FileNode) => {
    console.log('open file', file)
  }

  const handleOpenFolder = (folder: FileNode) => {
    navigateToFolder(folder.id)
  }

  return (
    <FileExplorer
      data={initialData}
      storageInfo={{
        totalBytes: storage.totalSize,
        availableBytes: storage.freeSize,
      }}
      lang="zh-CN"
      defaultViewMode="grid"
      fontSize="sm"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      onOpen={handleOpenFile}
      onOpenFolder={handleOpenFolder}
      onNavigateBreadcrumb={(item) => {
        const rootId = initialData.breadcrumbs[0]?.id
        navigateToFolder(item.id === rootId ? undefined : item.id)
      }}
    />
  )
}

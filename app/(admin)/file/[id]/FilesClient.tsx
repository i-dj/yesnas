'use client'

import type { StorageDrive } from '@/types'
import { FileExplorer, type FileExplorerData, type FileNode } from '@nextdj/file-explorer'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FILE_ACTION_TEXT, STORAGE_DIRECTORY_BREADCRUMB_ID, getFileExplorerLocale } from './file-explorer-settings'
import type { ExplorerTransferTarget } from './file-explorer-types'
import { useFileExplorerActions } from './use-file-explorer-actions'

interface FilesClientProps {
  storage: StorageDrive
  initialData: FileExplorerData
}

export function FilesClient({ storage, initialData }: FilesClientProps) {
  const router = useRouter()
  const locale = useLocale()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const explorerLang = getFileExplorerLocale(locale)
  const explorerTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const storageSource = useMemo(() => {
    const raw = `${storage.location || ''} ${storage.type || ''}`.toLowerCase()
    return raw.includes('cloud') || raw.includes('network') ? 'network' : 'local'
  }, [storage.location, storage.type])
  const storageDirectoryUrl = `/storage?source=${storageSource}`
  const explorerData = useMemo<FileExplorerData>(() => {
    const [root, ...rest] = initialData.breadcrumbs ?? []
    if (!root) return initialData

    return {
      ...initialData,
      breadcrumbs: [
        { id: STORAGE_DIRECTORY_BREADCRUMB_ID, name: FILE_ACTION_TEXT.storage },
        { ...root, name: storage.name },
        ...rest,
      ],
    }
  }, [initialData, storage.name])
  const rootFolderId = initialData.breadcrumbs[0]?.id
  const currentFolderId = initialData.breadcrumbs[initialData.breadcrumbs.length - 1]?.id ?? rootFolderId
  const transferTargets = useMemo<ExplorerTransferTarget[]>(
    () => (rootFolderId ? [{ id: rootFolderId, folderId: rootFolderId, name: storage.name }] : []),
    [rootFolderId, storage.name],
  )
  const refreshFiles = () => {
    router.refresh()
  }
  const { handleCreate, handleDelete, handleOpenFile, handleRename, handleTransfer, loadTransferFolder } =
    useFileExplorerActions({
      storageId: storage.id,
      currentFolderId,
      files: explorerData.files,
      refreshFiles,
    })

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigateToFolder = (parentId?: string) => {
    const url = parentId ? `/file/${storage.id}?parentId=${encodeURIComponent(parentId)}` : `/file/${storage.id}`
    router.push(url)
  }

  const handleOpenFolder = (folder: FileNode) => {
    navigateToFolder(folder.id)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="yesnas-file-explorer-page min-h-full">
      <FileExplorer
        data={explorerData}
        storageInfo={{
          totalBytes: storage.totalSize,
          availableBytes: storage.freeSize,
        }}
        lang={explorerLang}
        defaultViewMode="grid"
        fontSize="md"
        theme={explorerTheme}
        features={{
          uploadFile: false,
          uploadFolder: false,
          newFile: false,
          tagFilter: false,
        }}
        viewControls={{
          showTagFilterOption: false,
        }}
        onOpen={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        transferTargets={transferTargets}
        loadDataSourceFolder={loadTransferFolder}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        onCopy={({ entries, destination }) => handleTransfer(entries, destination, 'copy')}
        onMove={({ entries, destination }) => handleTransfer(entries, destination, 'move')}
        onNavigateBreadcrumb={(item) => {
          if (item.id === STORAGE_DIRECTORY_BREADCRUMB_ID) {
            router.push(storageDirectoryUrl)
            return
          }
          const rootId = initialData.breadcrumbs[0]?.id
          navigateToFolder(item.id === rootId ? undefined : item.id)
        }}
      />
    </div>
  )
}

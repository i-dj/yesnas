'use client'

import type { StorageDrive } from '@/types'
import {
  FileExplorer,
  type FileExplorerData,
  type FileExplorerLocale,
  type FileNode,
} from '@nextdj/file-explorer'
import { fileManagementApi, type FileConflictPolicy } from '@/lib/api/file-management.api'
import { useConfirmModal } from '@/hooks/use-confirm-modal'
import { toast } from '@/store/use-toast-store'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

interface FilesClientProps {
  storage: StorageDrive
  initialData: FileExplorerData
}

interface ExplorerTransferTarget {
  id: string
  name: string
  folderId?: string
  parentId?: string
}

interface ExplorerTransferDataSource {
  id: string
  name: string
  list: ExplorerTransferTarget[]
}

const STORAGE_DIRECTORY_BREADCRUMB_ID = '__yesnas_storage_directory__'
const FILE_EXPLORER_LOCALE_MAP: Record<string, FileExplorerLocale> = {
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  zh: 'zh-CN',
  'zh-CN': 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh-Hans-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'zh-HK': 'zh-TW',
  'zh-MO': 'zh-TW',
  'zh-Hant': 'zh-TW',
  'zh-Hant-TW': 'zh-TW',
  ja: 'ja',
  'ja-JP': 'ja',
  ko: 'ko',
  'ko-KR': 'ko',
  fr: 'fr',
  'fr-FR': 'fr',
  de: 'de',
  'de-DE': 'de',
  es: 'es',
  'es-ES': 'es',
  'pt-BR': 'pt-BR',
  ru: 'ru',
  'ru-RU': 'ru',
}

const getFileExplorerLocale = (locale: string): FileExplorerLocale =>
  FILE_EXPLORER_LOCALE_MAP[locale] ?? FILE_EXPLORER_LOCALE_MAP[locale.split('-')[0]] ?? 'en'

const FILE_ACTION_TEXT = {
  storage: '\u5b58\u50a8',
  conflictTitle: '\u53d1\u73b0\u540c\u540d\u9879\u76ee',
  conflictDescriptionPrefix: '\u76ee\u6807\u6587\u4ef6\u5939\u91cc\u5df2\u7ecf\u5b58\u5728',
  conflictDescriptionSuffix: '\u662f\u5426\u8986\u76d6\u5df2\u6709',
  folder: '\u6587\u4ef6\u5939',
  file: '\u6587\u4ef6',
  overwrite: '\u8986\u76d6',
  doNotOverwrite: '\u4e0d\u8986\u76d6',
  keepBothTitle: '\u4fdd\u7559\u4e24\u4e2a\u9879\u76ee\uff1f',
  keepBothPrefix: '\u662f\u5426\u81ea\u52a8\u91cd\u547d\u540d\u65b0\u9879\u76ee\uff0c\u8ba9',
  keepBothSuffix: '\u4e24\u8005\u90fd\u4fdd\u7559\uff1f',
  keepBoth: '\u4e24\u8005\u90fd\u4fdd\u7559',
  cancel: '\u53d6\u6d88',
  actionFailed: '\u6587\u4ef6\u64cd\u4f5c\u5931\u8d25',
  folderCreated: '\u5df2\u521b\u5efa\u6587\u4ef6\u5939',
  sameNameExists: '\u5df2\u5b58\u5728',
  renameSuccess: '\u91cd\u547d\u540d\u6210\u529f',
  deleteTitle: '\u5220\u9664\u6587\u4ef6',
  deleteConfirmPrefix: '\u786e\u5b9a\u8981\u628a',
  deleteConfirmSuffix: '\u4e2a\u9879\u76ee\u79fb\u5165\u56de\u6536\u7ad9\u5417\uff1f',
  delete: '\u5220\u9664',
  movedToTrash: '\u5df2\u79fb\u5165\u56de\u6536\u7ad9',
  copySuccess: '\u590d\u5236\u6210\u529f',
  moveSuccess: '\u79fb\u52a8\u6210\u529f',
} as const

export function FilesClient({ storage, initialData }: FilesClientProps) {
  const router = useRouter()
  const { confirm } = useConfirmModal()
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
      breadcrumbs: [{ id: STORAGE_DIRECTORY_BREADCRUMB_ID, name: FILE_ACTION_TEXT.storage }, { ...root, name: storage.name }, ...rest],
    }
  }, [initialData, storage.name])
  const rootFolderId = initialData.breadcrumbs[0]?.id
  const currentFolderId = initialData.breadcrumbs[initialData.breadcrumbs.length - 1]?.id ?? rootFolderId
  const transferTargets = useMemo<ExplorerTransferTarget[]>(
    () => (rootFolderId ? [{ id: rootFolderId, folderId: rootFolderId, name: storage.name }] : []),
    [rootFolderId, storage.name],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigateToFolder = (parentId?: string) => {
    const url = parentId ? `/file/${storage.id}?parentId=${encodeURIComponent(parentId)}` : `/file/${storage.id}`

    router.push(url)
  }

  const handleOpenFile = (file: FileNode) => {
    console.log('open file', file)
  }

  const handleOpenFolder = (folder: FileNode) => {
    navigateToFolder(folder.id)
  }

  const refreshFiles = () => {
    router.refresh()
  }

  const getDestinationParentId = (destination: ExplorerTransferTarget) => destination.folderId ?? destination.id

  const resolveConflictPolicy = async (
    entry: FileNode,
    destination: ExplorerTransferTarget,
  ): Promise<FileConflictPolicy | null> => {
    const parentId = getDestinationParentId(destination)
    const conflict = await fileManagementApi.checkConflict(storage.id, entry.id, {
      parentId,
      name: entry.name,
    })

    if (!conflict.hasConflict || conflict.targetId === entry.id) return 'error'

    const overwrite = await confirm({
      title: FILE_ACTION_TEXT.conflictTitle,
      description: (
        <span>
          {FILE_ACTION_TEXT.conflictDescriptionPrefix}
          {'\u300c'}
          {conflict.name}
          {'\u300d\u3002'}
          {FILE_ACTION_TEXT.conflictDescriptionSuffix}
          {conflict.targetType === 'folder' ? FILE_ACTION_TEXT.folder : FILE_ACTION_TEXT.file}
          {'\uff1f'}
        </span>
      ),
      confirmText: FILE_ACTION_TEXT.overwrite,
      cancelText: FILE_ACTION_TEXT.doNotOverwrite,
      isDestructive: true,
    })

    if (overwrite) return 'overwrite'

    const keepBoth = await confirm({
      title: FILE_ACTION_TEXT.keepBothTitle,
      description: (
        <span>
          {FILE_ACTION_TEXT.keepBothPrefix}
          {'\u300c'}
          {conflict.name}
          {'\u300d'}
          {FILE_ACTION_TEXT.keepBothSuffix}
        </span>
      ),
      confirmText: FILE_ACTION_TEXT.keepBoth,
      cancelText: FILE_ACTION_TEXT.cancel,
    })

    return keepBoth ? 'rename' : null
  }

  const runFileAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action()
      toast.success(successMessage)
      refreshFiles()
    } catch (error) {
      if (error instanceof Error && error.message === 'cancelled') return
      toast.error(error instanceof Error ? error.message : FILE_ACTION_TEXT.actionFailed, 5000)
      throw error
    }
  }

  const handleCreate = async (entry: { name: string; type: FileNode['type']; parentId?: string }) => {
    if (entry.type !== 'folder') return
    const created = await fileManagementApi.createFolder(storage.id, {
      parentId: entry.parentId ?? currentFolderId,
      name: entry.name,
    })
    toast.success(`${FILE_ACTION_TEXT.folderCreated}\uff1a${created.name || entry.name}`)
    refreshFiles()
    return {
      id: created.id,
      name: created.name || entry.name,
      type: 'folder' as const,
      parentId: created.parentId,
    }
  }

  const handleRename = async (entry: { id: string; name: string; type: FileNode['type']; parentId?: string }) => {
    const original = explorerData.files.find((file) => file.id === entry.id)
    const name = entry.name.trim()
    if (!name || original?.name === name) return

    const parentId = entry.parentId ?? original?.parentId ?? currentFolderId
    if (parentId) {
      const conflict = await fileManagementApi.checkConflict(storage.id, entry.id, { parentId, name })
      if (conflict.hasConflict && conflict.targetId !== entry.id) {
        const message = `${conflict.targetType === 'folder' ? FILE_ACTION_TEXT.folder : FILE_ACTION_TEXT.file}${FILE_ACTION_TEXT.sameNameExists}\uff1a${conflict.name}`
        toast.error(message, 5000)
        throw new Error(message)
      }
    }

    await runFileAction(() => fileManagementApi.rename(storage.id, entry.id, name).then(() => undefined), FILE_ACTION_TEXT.renameSuccess)
  }

  const handleDelete = async (entries: FileNode[]) => {
    if (entries.length === 0) return

    const ok = await confirm({
      title: FILE_ACTION_TEXT.deleteTitle,
      description: `${FILE_ACTION_TEXT.deleteConfirmPrefix} ${entries.length} ${FILE_ACTION_TEXT.deleteConfirmSuffix}`,
      confirmText: FILE_ACTION_TEXT.delete,
      cancelText: FILE_ACTION_TEXT.cancel,
      isDestructive: true,
    })
    if (!ok) return

    await runFileAction(
      async () => {
        for (const entry of entries) {
          await fileManagementApi.delete(storage.id, entry.id)
        }
      },
      FILE_ACTION_TEXT.movedToTrash,
    )
  }

  const handleTransfer = async (
    entries: FileNode[],
    destination: ExplorerTransferTarget,
    action: 'copy' | 'move',
  ) => {
    if (entries.length === 0) return
    const parentId = getDestinationParentId(destination)

    await runFileAction(
      async () => {
        for (const entry of entries) {
          const conflictPolicy = await resolveConflictPolicy(entry, destination)
          if (!conflictPolicy) throw new Error('cancelled')

          const payload = {
            parentId,
            name: entry.name,
            conflictPolicy,
          }

          if (action === 'copy') {
            await fileManagementApi.copy(storage.id, entry.id, payload)
          } else {
            await fileManagementApi.move(storage.id, entry.id, payload)
          }
        }
      },
      action === 'copy' ? FILE_ACTION_TEXT.copySuccess : FILE_ACTION_TEXT.moveSuccess,
    )
  }

  const loadTransferFolder = async (_source: ExplorerTransferDataSource, target: ExplorerTransferTarget) =>
    fileManagementApi.list(storage.id, { parentId: getDestinationParentId(target) })

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

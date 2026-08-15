'use client'

import type { FileConflictPolicy } from '@/types'
import type { FileNode } from '@nextdj/file-explorer'
import { fileManagementApi } from '@/lib/api/file-management.api'
import { useConfirmModal } from '@/hooks/use-confirm-modal'
import { toast } from '@/store/use-toast-store'
import { FILE_ACTION_TEXT } from './file-explorer-settings'
import type { ExplorerTransferDataSource, ExplorerTransferTarget } from './file-explorer-types'

interface UseFileExplorerActionsOptions {
  storageId: string
  currentFolderId?: string
  files: FileNode[]
  refreshFiles: () => void
}

const getDestinationParentId = (destination: ExplorerTransferTarget) => destination.folderId ?? destination.id

const audioExtensions = new Set(['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'weba'])
const videoExtensions = new Set(['m4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'ogv', 'webm'])

const getFileExtension = (file: FileNode) => {
  const extension = file.extension?.replace(/^\./, '').toLowerCase()
  if (extension) return extension

  const name = file.name.toLowerCase()
  const dotIndex = name.lastIndexOf('.')
  return dotIndex > -1 ? name.slice(dotIndex + 1) : ''
}

const getPlayableMediaType = (file: FileNode): 'audio' | 'video' | null => {
  const extension = getFileExtension(file)
  if (videoExtensions.has(extension)) return 'video'
  if (audioExtensions.has(extension)) return 'audio'

  const mimeType = file.mimeType?.toLowerCase()
  const mediaType = file.mediaType?.toLowerCase()
  if (mimeType?.startsWith('audio/') || mediaType === 'audio') return 'audio'
  if (mimeType?.startsWith('video/') || mediaType === 'video') return 'video'

  return null
}

export function useFileExplorerActions({
  storageId,
  currentFolderId,
  files,
  refreshFiles,
}: UseFileExplorerActionsOptions) {
  const { confirm } = useConfirmModal()

  const resolveConflictPolicy = async (
    entry: FileNode,
    destination: ExplorerTransferTarget,
  ): Promise<FileConflictPolicy | null> => {
    const parentId = getDestinationParentId(destination)
    const conflict = await fileManagementApi.checkConflict(storageId, entry.id, {
      parentId,
      name: entry.name,
    })

    if (!conflict.hasConflict || conflict.targetId === entry.id) return 'error'

    const overwrite = await confirm({
      title: FILE_ACTION_TEXT.conflictTitle,
      description: (
        <span>
          {FILE_ACTION_TEXT.conflictDescriptionPrefix}
          {'「'}
          {conflict.name}
          {'」。'}
          {FILE_ACTION_TEXT.conflictDescriptionSuffix}
          {conflict.targetType === 'folder' ? FILE_ACTION_TEXT.folder : FILE_ACTION_TEXT.file}
          {'？'}
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
          {'「'}
          {conflict.name}
          {'」'}
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

  const handleOpenFile = (file: FileNode) => {
    const mediaType = getPlayableMediaType(file)
    if (mediaType) {
      const params = new URLSearchParams({
        storageId,
        fileId: file.id,
        media: mediaType,
        name: file.name,
      })
      window.open(`/player?${params.toString()}`, '_blank', 'noopener,noreferrer')
      return
    }

    window.open(fileManagementApi.contentUrl(storageId, file.id), '_blank', 'noopener,noreferrer')
  }

  const handleCreate = async (entry: { name: string; type: FileNode['type']; parentId?: string }) => {
    if (entry.type !== 'folder') return

    const created = await fileManagementApi.createFolder(storageId, {
      parentId: entry.parentId ?? currentFolderId,
      name: entry.name,
    })

    toast.success(`${FILE_ACTION_TEXT.folderCreated}：${created.name || entry.name}`)
    refreshFiles()

    return {
      id: created.id,
      name: created.name || entry.name,
      type: 'folder' as const,
      parentId: created.parentId,
    }
  }

  const handleRename = async (entry: { id: string; name: string; type: FileNode['type']; parentId?: string }) => {
    const original = files.find((file) => file.id === entry.id)
    const name = entry.name.trim()
    if (!name || original?.name === name) return

    const parentId = entry.parentId ?? original?.parentId ?? currentFolderId
    if (parentId) {
      const conflict = await fileManagementApi.checkConflict(storageId, entry.id, { parentId, name })
      if (conflict.hasConflict && conflict.targetId !== entry.id) {
        const message = `${conflict.targetType === 'folder' ? FILE_ACTION_TEXT.folder : FILE_ACTION_TEXT.file}${FILE_ACTION_TEXT.sameNameExists}：${conflict.name}`
        toast.error(message, 5000)
        throw new Error(message)
      }
    }

    await runFileAction(
      () => fileManagementApi.rename(storageId, entry.id, name).then(() => undefined),
      FILE_ACTION_TEXT.renameSuccess,
    )
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

    await runFileAction(async () => {
      for (const entry of entries) {
        await fileManagementApi.delete(storageId, entry.id)
      }
    }, FILE_ACTION_TEXT.movedToTrash)
  }

  const handleTransfer = async (entries: FileNode[], destination: ExplorerTransferTarget, action: 'copy' | 'move') => {
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
            await fileManagementApi.copy(storageId, entry.id, payload)
          } else {
            await fileManagementApi.move(storageId, entry.id, payload)
          }
        }
      },
      action === 'copy' ? FILE_ACTION_TEXT.copySuccess : FILE_ACTION_TEXT.moveSuccess,
    )
  }

  const loadTransferFolder = async (_source: ExplorerTransferDataSource, target: ExplorerTransferTarget) =>
    fileManagementApi.list(storageId, { parentId: getDestinationParentId(target) })

  return {
    handleOpenFile,
    handleCreate,
    handleRename,
    handleDelete,
    handleTransfer,
    loadTransferFolder,
  }
}

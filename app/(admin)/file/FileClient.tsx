'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { ActionMenu, Button, ConfirmModal, MoreButton, ToggleButton } from '@/components/ui'
import type { ActionMenuConfig } from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { FileExplorer, type CategoryColor, type FileListColumn, type FileNode } from '@nextdj/file-explorer'
import { Copy, FolderInput, Eye, Trash2 } from 'lucide-react'

import type { QuickFilterType, StorageLocation } from './types'
import { QUICK_FILTERS, STORAGE_LOCATIONS } from './constants'
import { fileManagementApi } from '@/lib/api/file-management.api'
import { StorageDrive } from '@/types'
import Link from 'next/link'
import { cn, formatDateTime } from '@/lib/utils'
import { ColorFilterSelect, StorageCard, TrashFileDetail, type StorageIoStats } from './components'

interface FileClientProps {
  files: Record<QuickFilterType, FileNode[]>
  storages: StorageDrive[]
}

type FileFilterMode = QuickFilterType | 'tags'

interface StorageIoStatsError {
  storageId: string
  message: string
}

interface StoragesIoStatsPayload {
  items: StorageIoStats[]
  errors: StorageIoStatsError[]
}

export function FileClient({ files, storages }: FileClientProps) {
  const tFile = useTranslations('File')
  const tCommon = useTranslations('Common.actions')
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState<StorageLocation>('local')
  const [activeFilter, setActiveFilter] = useState<FileFilterMode>('tags')
  const [selectedColors, setSelectedColors] = useState<CategoryColor[]>([])
  const [fileGroups, setFileGroups] = useState(files)

  useEffect(() => {
    setFileGroups(files)
  }, [files])

  const isTrashMode = activeFilter === 'trash'

  const visibleStorages = useMemo(
    () => storages.filter((storage) => storage.location === activeTab),
    [activeTab, storages],
  )
  const storageLocationItems = useMemo(
    () =>
      STORAGE_LOCATIONS.map((item) => ({
        value: item.value,
        label: tFile(`locations.${item.value}`),
      })),
    [tFile],
  )
  const quickFilterItems = useMemo(
    () =>
      QUICK_FILTERS.map((item) => ({
        ...item,
        label: tFile(`filters.${item.value}`),
      })),
    [tFile],
  )

  const { data: storagesIoStats } = useSse<StoragesIoStatsPayload>(fileManagementApi.storagesIoStatsStreamUrl(1), {
    event: 'io-stats',
    parser: (raw) => JSON.parse(raw) as StoragesIoStatsPayload,
  })

  const storageIoStatsById = useMemo(
    () =>
      Object.fromEntries((storagesIoStats?.items ?? []).map((item) => [item.storageId, item])) as Record<
        string,
        StorageIoStats
      >,
    [storagesIoStats],
  )

  const storageIoErrorsById = useMemo(
    () =>
      Object.fromEntries((storagesIoStats?.errors ?? []).map((item) => [item.storageId, item.message])) as Record<
        string,
        string
      >,
    [storagesIoStats],
  )

  const activeFiles = useMemo(() => {
    if (activeFilter === 'tags') return fileGroups.favorites ?? []

    return fileGroups[activeFilter] ?? []
  }, [activeFilter, fileGroups])

  const filteredFiles = useMemo(() => {
    if (activeFilter !== 'tags' || selectedColors.length === 0) return activeFiles

    return activeFiles.filter((file) => file.tagColors?.some((color) => selectedColors.includes(color)))
  }, [activeFiles, activeFilter, selectedColors])

  const fileExplorerFeatures = useMemo(
    () => ({
      uploadFile: false,
      uploadFolder: false,
      newFolder: false,
      newFile: false,
      download: false,
      move: !isTrashMode,
      copy: !isTrashMode,
      rename: false,
      delete: isTrashMode,
      detail: isTrashMode,
      preview: !isTrashMode,
      tagFilter: false,
    }),
    [isTrashMode],
  )

  const removeTrashEntries = (entries: FileNode[]) => {
    if (entries.length === 0) return

    const targetIds = new Set(entries.map((entry) => entry.id))

    setFileGroups((current) => ({
      ...current,
      trash: (current.trash ?? []).filter((file) => !targetIds.has(file.id)),
    }))
  }

  const handlePermanentDelete = (entry: FileNode) => {
    removeTrashEntries([entry])
  }

  const handleClearTrash = () => {
    removeTrashEntries(fileGroups.trash ?? [])
  }

  const handleOpenEntry = (entry: FileNode) => {
    if (entry.type === 'folder') {
      console.log('open folder', entry)
      return
    }

    console.log('open file', entry)
  }

  const handleCopyEntry = (entry: FileNode) => {
    console.log('copy file', entry)
  }

  const handleMoveEntry = (entry: FileNode) => {
    console.log('move file', entry)
  }

  const getActionMenuItems = (entry: FileNode): ActionMenuConfig[] => [
    {
      label: tCommon('open'),
      action: 'open',
      icon: Eye,
      onSelect: () => handleOpenEntry(entry),
    },
    {
      label: tCommon('copy'),
      action: 'copy',
      icon: Copy,
      onSelect: () => handleCopyEntry(entry),
    },
    {
      label: tCommon('move'),
      action: 'move',
      icon: FolderInput,
      onSelect: () => handleMoveEntry(entry),
    },
  ]

  const renderActionColumn = (_: unknown, entry: FileNode) => {
    if (isTrashMode) {
      return (
        <div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <ConfirmModal
            title={tFile('actions.permanentDeleteFileTitle')}
            description={tFile('actions.permanentDeleteFileDescription', {
              name: entry.name,
            })}
            confirmText={tFile('actions.permanentDelete')}
            onConfirm={() => handlePermanentDelete(entry)}
            trigger={
              <Button variant="ghost" size="sm" isDelete icon={Trash2} onClick={(event) => event.stopPropagation()} />
            }
          />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <ActionMenu
          mode="left-click"
          align="end"
          onAction={() => {}}
          items={getActionMenuItems(entry)}
          trigger={
            <MoreButton
              className="h-8 w-8 rounded-full border-0 hover:bg-neutral-100"
              onClick={(event) => event.stopPropagation()}
            />
          }
        />
      </div>
    )
  }

  const getListColumns = (defaultColumns: FileListColumn[]) => {
    const nameColumn = defaultColumns.find((column) => column.key === 'name')
    const typeColumn = defaultColumns.find((column) => column.key === 'type')
    const sizeColumn = defaultColumns.find((column) => column.key === 'size')
    const updatedAtColumn = defaultColumns.find((column) => column.key === 'updatedAt')

    const actionColumn: FileListColumn = {
      key: '__actions__',
      label: '',
      width: '100px',
      align: 'right',
      render: renderActionColumn,
    }

    if (!isTrashMode) {
      return [nameColumn, typeColumn, sizeColumn, updatedAtColumn, actionColumn].filter(Boolean) as FileListColumn[]
    }

    const deletedAtColumn: FileListColumn = {
      key: 'deletedAt',
      label: tFile('columns.deletedAt'),
      width: '180px',
      sortable: true,
      render: (_, record) => (
        <span className="text-(--_fe-text-muted)">{formatDateTime(record.metadata?.deletedAt)}</span>
      ),
      sortValue: (record) => (record.metadata?.deletedAt ? new Date(record.metadata.deletedAt).getTime() : 0),
    }

    return [nameColumn, typeColumn, sizeColumn, deletedAtColumn, actionColumn].filter(Boolean) as FileListColumn[]
  }

  const handleTagColorsChange = (targetFile: FileNode, colors: CategoryColor[]) => {
    setFileGroups((current) => {
      const nextEntries = Object.entries(current).map(([key, list]) => [
        key,
        list.map((file) => (file.id === targetFile.id ? { ...file, tagColors: colors } : file)),
      ])

      return Object.fromEntries(nextEntries) as Record<QuickFilterType, FileNode[]>
    })
  }

  return (
    <PageWrapper className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-6">
      <ToggleButton
        className="mb-3 gap-6 rounded-none"
        variant="segmented"
        items={storageLocationItems}
        value={activeTab}
        onChange={setActiveTab}
      />

      <div className="flex flex-row gap-5">
        {visibleStorages.map((storage) => (
          <Link href={`/file/${storage.id}`} key={storage.id}>
            <StorageCard
              storage={storage}
              ioStats={storageIoStatsById[storage.id]}
              ioError={storageIoErrorsById[storage.id]}
            />
          </Link>
        ))}
      </div>

      {visibleStorages.length === 0 && (
        <div className="border-app-border bg-app-item-bg/30 text-app-text-muted rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
          {tFile('emptyStorages')}
        </div>
      )}

      <div className="mt-10 flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-2">
          <ColorFilterSelect
            selectedColors={selectedColors}
            onChange={setSelectedColors}
            active={activeFilter === 'tags'}
            onActivate={() => setActiveFilter('tags')}
          />
          {quickFilterItems.map((item) => {
            const Icon = item.icon
            const isActive = activeFilter === item.value

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveFilter(item.value)}
                className={cn(
                  'bg-app-surface hover:border-app-border-strong flex h-8 items-center gap-2 rounded-lg border px-3 text-[12px] transition-colors duration-200 ease-out outline-none',
                  isActive
                    ? 'border-app-border-strong text-app-text'
                    : 'border-app-border text-app-text-muted hover:text-app-text',
                )}
              >
                <Icon size={16} strokeWidth={2} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>

        {isTrashMode && (
          <ConfirmModal
            title={tFile('actions.clearTrashTitle')}
            description={tFile('actions.clearTrashDescription')}
            confirmText={tFile('actions.clearTrash')}
            onConfirm={handleClearTrash}
            trigger={
              <Button variant="danger" size="sm">
                {tCommon('clearTrash')}
              </Button>
            }
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <FileExplorer
          files={filteredFiles}
          getListColumns={getListColumns}
          showBreadcrumbs={false}
          showToolbar={false}
          fontSize="sm"
          viewControls={{
            showDisplayButton: false,
            showViewToggleButton: false,
          }}
          lang={locale === 'zh' ? 'zh-CN' : 'en-US'}
          defaultViewMode="list"
          gridSize="sm"
          allowMultiSelect={false}
          features={fileExplorerFeatures}
          renderDetail={(file) => (isTrashMode ? <TrashFileDetail file={file} /> : undefined)}
          onOpen={handleOpenEntry}
          onOpenFolder={handleOpenEntry}
          onNavigateBreadcrumb={(item) => {
            console.log('navigate breadcrumb', item)
          }}
          onDelete={removeTrashEntries}
          onCopy={({ entries, destination }) => {
            console.log('copy files', entries, destination)
          }}
          onMove={({ entries, destination }) => {
            console.log('move files', entries, destination)
          }}
          onTagColorsChange={handleTagColorsChange}
        />
      </div>
    </PageWrapper>
  )
}

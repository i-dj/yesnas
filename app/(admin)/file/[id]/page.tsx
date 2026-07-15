import { fileManagementApi } from '@/lib/api/file-management.api'
import { storageApi } from '@/lib/api/storage.api'
import { notFound } from 'next/navigation'

import { FilesClient } from './FilesClient'

interface StoragePageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ parentId?: string }>
}

export default async function Page({ params, searchParams }: StoragePageProps) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const parentId = resolvedSearchParams?.parentId

  const [storages, explorerData] = await Promise.all([
    storageApi.listStorages(),
    fileManagementApi.filesByPath(id, { parentId }),
  ])
  const storage = storages.find((item) => item.id === id)

  if (!storage) {
    notFound()
  }

  return <FilesClient storage={storage} initialData={explorerData} />
}

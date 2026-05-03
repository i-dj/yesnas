import { getFilesByPath, getStorageById } from '@/lib/server/file-service'
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

  const [storage, explorerData] = await Promise.all([
    getStorageById(id),
    getFilesByPath(id, { parentId }),
  ])

  if (!storage) {
    notFound()
  }

  return <FilesClient storage={storage} initialData={explorerData} />
}

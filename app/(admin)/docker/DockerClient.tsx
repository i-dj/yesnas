'use client'

import { Boxes, Database, Download, Layers3, Network, Package, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { PageWrapper } from '@/components/layout/page-wrapper'
import {
  Button,
  ResourceDataToolbar,
  ResourceDataView,
  SearchInput,
  ToggleButton,
  type ResourceDataColumn,
} from '@/components/ui'
import { useSse } from '@/hooks/use-sse'
import { toast } from '@/store/use-toast-store'
import type {
  DockerComposeProject,
  DockerContainer,
  DockerContainersSnapshot,
  DockerImage,
  DockerNetwork,
  DockerVolume,
} from '@/types'
import { dockerComposeColumns } from './components/docker-compose-columns'
import { getDockerContainerColumns } from './components/docker-container-columns'
import { DockerCreateMenu } from './components/docker-create-menu'
import { dockerImageColumns } from './components/docker-image-columns'
import { DockerImagePullDrawer } from './components/docker-image-pull-drawer'
import { dockerNetworkColumns } from './components/docker-network-columns'
import { DockerSummaryCards } from './components/docker-summary-cards'
import { dockerVolumeColumns, type DockerVolumeRow } from './components/docker-volume-columns'

export type DockerTab = 'containers' | 'images' | 'compose' | 'networks' | 'volumes'
type DockerResourceRow = DockerContainer | DockerImage | DockerComposeProject | DockerNetwork | DockerVolumeRow

const tabItems = [
  { value: 'containers', label: '容器', icon: Boxes },
  { value: 'images', label: '镜像', icon: Package },
  { value: 'compose', label: 'Compose', icon: Layers3 },
  { value: 'networks', label: '网络', icon: Network },
  { value: 'volumes', label: '卷', icon: Database },
] as const

const tabValues = tabItems.map((item) => item.value)

const readDockerTabFromURL = (): DockerTab => {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  if (tab === 'overview') return 'containers'
  if (tab === 'resources') return 'networks'
  return tabValues.includes(tab as DockerTab) ? (tab as DockerTab) : 'containers'
}

const dockerTabHref = (tab: DockerTab) => (tab === 'containers' ? '/docker' : `/docker?tab=${tab}`)

interface DockerClientProps {
  initialTab: DockerTab
  initialResources: DockerResources
  initialResourcesError?: string
}

export interface DockerResources {
  images: DockerImage[]
  composeProjects: DockerComposeProject[]
  networks: DockerNetwork[]
  volumes: DockerVolume[]
}

export function DockerClient({ initialTab, initialResources, initialResourcesError }: DockerClientProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [tab, setTab] = useState<DockerTab>(initialTab)
  const [query, setQuery] = useState('')
  const { data: containerSnapshot } = useSse<DockerContainersSnapshot>('docker.containers', { interval: 1 })
  const [pullDrawerOpen, setPullDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const containers = containerSnapshot?.items ?? []
  const { images, composeProjects, networks, volumes } = initialResources

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    const syncTabFromURL = () => setTab(readDockerTabFromURL())
    window.addEventListener('popstate', syncTabFromURL)
    return () => window.removeEventListener('popstate', syncTabFromURL)
  }, [])

  const changeTab = useCallback((nextTab: DockerTab) => {
    setTab(nextTab)
    setPage(1)
    window.history.pushState(null, '', dockerTabHref(nextTab))
  }, [])

  const refreshResources = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh()
    })
  }, [router])

  useEffect(() => {
    if (!initialResourcesError) return
    toast.error(initialResourcesError)
  }, [initialResourcesError])

  const filteredContainers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return containers
    return containers.filter((item) => `${item.name} ${item.image}`.toLowerCase().includes(keyword))
  }, [containers, query])

  const filteredImages = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return images
    return images.filter((item) => `${item.repository} ${item.tag} ${item.id}`.toLowerCase().includes(keyword))
  }, [images, query])

  const filteredComposeProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return composeProjects
    return composeProjects.filter((item) =>
      `${item.name} ${item.status} ${item.configFiles ?? ''} ${item.workingDir ?? ''}`.toLowerCase().includes(keyword),
    )
  }, [composeProjects, query])

  const filteredNetworks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return networks
    return networks.filter((item) => `${item.name} ${item.driver} ${item.subnet ?? ''}`.toLowerCase().includes(keyword))
  }, [networks, query])

  const filteredVolumes = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return volumes
    return volumes.filter((item) => `${item.name} ${item.driver} ${item.mountpoint}`.toLowerCase().includes(keyword))
  }, [volumes, query])

  useEffect(() => {
    setPage(1)
  }, [query])

  const imageIconByRef = useMemo(() => {
    const iconMap = new Map<string, string>()
    images.forEach((image) => {
      if (!image.icon) return
      const repository = image.repository.trim()
      const tag = image.tag.trim()
      if (!repository) return
      iconMap.set(repository, image.icon)
      if (tag) iconMap.set(`${repository}:${tag}`, image.icon)
    })
    return iconMap
  }, [images])

  const tabItemsWithBadges = useMemo(
    () =>
      tabItems.map((item) => ({
        ...item,
        badge:
          item.value === 'containers'
            ? containers.length
            : item.value === 'images'
              ? images.length
              : item.value === 'compose'
                ? composeProjects.length
                : item.value === 'networks'
                  ? networks.length
                  : volumes.length,
      })),
    [composeProjects.length, containers.length, images.length, networks.length, volumes.length],
  )

  const searchPlaceholder = {
    containers: '搜索容器',
    images: '搜索镜像',
    compose: '搜索 Compose',
    networks: '搜索网络',
    volumes: '搜索卷',
  }[tab]

  const volumeRows = useMemo(() => filteredVolumes.map((volume) => ({ ...volume, id: volume.name })), [filteredVolumes])
  const containerColumns = useMemo(() => getDockerContainerColumns(imageIconByRef), [imageIconByRef])
  const activeResource = useMemo(() => {
    switch (tab) {
      case 'images':
        return { id: 'docker-images', data: filteredImages, columns: dockerImageColumns, loading: isRefreshing }
      case 'compose':
        return {
          id: 'docker-compose',
          data: filteredComposeProjects,
          columns: dockerComposeColumns,
          loading: isRefreshing,
        }
      case 'networks':
        return {
          id: 'docker-networks',
          data: filteredNetworks,
          columns: dockerNetworkColumns,
          loading: isRefreshing,
        }
      case 'volumes':
        return { id: 'docker-volumes', data: volumeRows, columns: dockerVolumeColumns, loading: isRefreshing }
      case 'containers':
      default:
        return {
          id: 'docker-containers',
          data: filteredContainers,
          columns: containerColumns,
          loading: isRefreshing || !containerSnapshot,
        }
    }
  }, [
    containerColumns,
    containerSnapshot,
    filteredComposeProjects,
    filteredContainers,
    filteredImages,
    filteredNetworks,
    isRefreshing,
    tab,
    volumeRows,
  ])
  const totalPages = Math.max(1, Math.ceil(activeResource.data.length / pageSize))
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize
    return activeResource.data.slice(start, start + pageSize)
  }, [activeResource.data, page, pageSize])

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages))
  }, [totalPages])

  return (
    <PageWrapper className="gap-6 overflow-visible">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-app-text text-3xl font-semibold tracking-tight">Docker 管理</h1>
          <p className="text-app-text-muted mt-2 max-w-2xl text-sm">
            管理容器、镜像、网络和数据卷，快速查看资源占用和运行状态。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DockerCreateMenu onPullClick={() => setPullDrawerOpen(true)} />
        </div>
      </section>

      <DockerSummaryCards snapshot={containerSnapshot} />

      <ResourceDataView
        id={activeResource.id}
        data={pageData as DockerResourceRow[]}
        columns={activeResource.columns as ResourceDataColumn<DockerResourceRow>[]}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={activeResource.loading}
        toolbar={
          <ResourceDataToolbar
            leading={
              <ToggleButton
                items={tabItemsWithBadges}
                value={tab}
                onChange={changeTab}
                variant="surface"
                showMaxItems={4}
                className="border-app-border/70 bg-app-bg h-10 w-auto shrink-0 overflow-hidden rounded-lg border"
                itemClassName="px-3"
              />
            }
            content={
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                wrapperClassName="border-app-border/70 hover:border-app-border focus-within:border-app-border h-10 min-w-0 rounded-lg border transition-colors [&>div]:h-full [&>div>div]:h-full"
                className="h-full rounded-lg bg-transparent shadow-none hover:bg-transparent focus:bg-transparent"
              />
            }
            actions={
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                iconSize={13}
                iconClassName={isRefreshing ? 'animate-spin' : undefined}
                className="border-app-border/70 text-app-text-muted hover:border-app-border hover:text-app-text h-10 bg-transparent px-3 hover:bg-transparent"
                onClick={refreshResources}
              >
                Refresh
              </Button>
            }
          />
        }
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize)
          setPage(1)
        }}
      />

      <DockerImagePullDrawer open={pullDrawerOpen} onOpenChange={setPullDrawerOpen} onCompleted={refreshResources} />
    </PageWrapper>
  )
}

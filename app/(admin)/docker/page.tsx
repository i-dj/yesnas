import { DockerClient } from './DockerClient'
import type { DockerResources, DockerTab } from './DockerClient'
import { dockerApi } from '@/lib/api/docker.api'
import { settleListRequests } from '@/lib/api/request'

const dockerTabs: DockerTab[] = ['containers', 'images', 'compose', 'networks', 'volumes']

async function loadInitialDockerResources(): Promise<{
  resources: DockerResources
  error?: string
}> {
  const { data, error } = await settleListRequests({
    images: dockerApi.listImages(),
    composeProjects: dockerApi.listComposeProjects(),
    networks: dockerApi.listNetworks(),
    volumes: dockerApi.listVolumes(),
  })

  return {
    resources: data,
    error,
  }
}

export default async function Page({ searchParams }: { searchParams?: Promise<{ tab?: string | string[] }> }) {
  const [params, initialDockerResources] = await Promise.all([searchParams, loadInitialDockerResources()])
  const tab = Array.isArray(params?.tab) ? params.tab[0] : params?.tab
  const normalizedTab = tab === 'overview' ? 'containers' : tab === 'resources' ? 'networks' : tab
  const initialTab: DockerTab = dockerTabs.includes(normalizedTab as DockerTab)
    ? (normalizedTab as DockerTab)
    : 'containers'

  return (
    <DockerClient
      initialTab={initialTab}
      initialResources={initialDockerResources.resources}
      initialResourcesError={initialDockerResources.error}
    />
  )
}

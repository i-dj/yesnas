export interface DockerContainerPort {
  ip?: string
  hostPort?: number
  containerPort: number
  protocol: string
}

export interface DockerContainerMount {
  type: string
  source: string
  destination: string
  mode?: string
  readWrite: boolean
  name?: string
}

export interface DockerContainer {
  id: string
  name: string
  image: string
  state?: string
  status?: string
  running: boolean
  createdAt?: string
  startedAt?: string
  finishedAt?: string
  uptimeSeconds: number
  cpuPercent: number
  memoryUsageBytes: number
  memoryLimitBytes: number
  memoryPercent: number
  networkRxBytes: number
  networkTxBytes: number
  ports: DockerContainerPort[]
  mounts: DockerContainerMount[]
}

export interface DockerContainersSnapshot {
  items: DockerContainer[]
  checkedAt: string
}

export interface DockerImage {
  id: string
  repository: string
  tag: string
  digest?: string
  size: string
  createdAt?: string
  created?: string
  icon?: string
}

export interface DockerNetwork {
  id: string
  name: string
  driver: string
  scope: string
  internal: boolean
  ipv6: boolean
  subnet?: string
  gateway?: string
  containers: number
}

export interface DockerVolume {
  name: string
  driver: string
  mountpoint: string
  scope?: string
  createdAt?: string
}

export interface DockerComposeProject {
  id: string
  name: string
  status: string
  configFiles?: string
  workingDir?: string
  environment?: string
  services?: string
}

export interface DockerImagePullEvent {
  stage: 'started' | 'running' | 'warning' | 'completed' | 'failed'
  message: string
  percent?: number
  imageRef?: string
  exitCode?: number
  updatedAt: string
}

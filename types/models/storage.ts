export interface DiskUsageModel {
  type: string
  label?: string
  mountpoint?: string
  storagePoolId?: string
  storagePoolName?: string
  storageId?: string
  deviceRole?: string
}

export interface DiskModel {
  path: string
  name: string
  kernelName: string
  size: string
  sizeBytes: number
  model: string
  serial: string
  vendor?: string
  transport: string
  fsType?: string
  label?: string
  uuid?: string
  mountpoints?: string[]
  removable: boolean
  hotplug: boolean
  readOnly: boolean
  hasChildren: boolean
  usage?: string
  usages?: DiskUsageModel[]
  inUse: boolean
  isSystemDisk?: boolean
  isRaidDisk?: boolean
  temperatureC: number
  health: string
  smartAvailable: boolean
  smartPassed: boolean
  powerOnHours: number
  powerCycleCount: number
  readBytesTotal: number
  writeBytesTotal: number
  readOpsTotal: number
  writeOpsTotal: number
  readBytesPerSec: number
  writeBytesPerSec: number
  readOpsPerSec: number
  writeOpsPerSec: number
  partitions?: DiskPartitionModel[]
  sampledAt: string
}

export interface DiskPartitionModel {
  path: string
  name: string
  kernelName: string
  parentPath?: string
  size: string
  sizeBytes: number
  sizeHuman: string
  fsType?: string
  label?: string
  uuid?: string
  mountpoints?: string[]
  readOnly: boolean
  hasChildren: boolean
  usage?: string
  usages?: DiskUsageModel[]
  inUse: boolean
  isSystemPartition?: boolean
  isRaidPartition?: boolean
}

export interface StoragePoolModel {
  id: string
  storageId: string
  name: string
  filesystem: string
  raidLevel: string
  mountPath: string
  dataPath: string
  createdAt: string
  updatedAt: string
  devices: Array<
    DiskModel & {
      id: string
      poolId: string
      devicePath: string
      deviceName: string
      deviceRole: string
    }
  >
  status: string
  health: string
  mounted: boolean
  totalBytes: number
  usedBytes: number
  freeBytes: number
  usagePercent: number
  readSpeedBytesPerSec?: number
  writeSpeedBytesPerSec?: number
  dataProfile: string
  metadataProfile: string
  systemProfile: string
  snapshotCount: number
  snapshots: unknown[]
  warnings: string[]
  lastCheckedAt: string
}

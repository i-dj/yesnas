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
  kind?: 'local' | 'cloud' | string
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
      state?: string
      health?: string
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
  autoSnapshotEnabled?: boolean
  autoSnapshotSchedule?: string
  snapshots: StoragePoolSnapshotModel[]
  warnings: string[]
  lastCheckedAt: string
}

export interface StoragePoolSnapshotModel {
  id: string
  systemSnapshotId?: number
  systemGeneration?: number
  path: string
  name: string
  sourcePath?: string
  sizeBytes: number
  description?: string
  createdBy?: string
  createdAt: string
  updatedAt?: string
  isReadOnly?: boolean
  readOnly?: boolean
  registered?: boolean
}

export interface CreateStoragePoolPayload {
  name: string
  raidLevel: string
  paths: string[]
  cacheDiskPaths?: string[]
  autoSnapshotEnabled?: boolean
  autoSnapshotSchedule?: string
}

export interface CreateStoragePoolSnapshotPayload {
  name: string
  sourcePath?: string
  description?: string
  readOnly?: boolean
}

export interface RestoreStoragePoolSnapshotPayload {
  password: string
  createBackup?: boolean
}

export interface ReplaceStoragePoolDevicePayload {
  password: string
  oldDevicePath: string
  newDevicePath: string
}

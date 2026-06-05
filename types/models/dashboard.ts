export type SystemState = 'healthy' | 'warning' | 'error' | 'unknown'

export type SystemStatusSnapshot = {
  status: {
    state: SystemState
    uptimeSeconds: number
  }
  systemDisk: {
    mountPath: string
    totalBytes: number
    usedBytes: number
    freeBytes: number
    usagePercent: number
    health: SystemState
  }
  load: {
    load1: number
    load5: number
    load15: number
  }
  diskIo: {
    readBytesPerSec: number
    writeBytesPerSec: number
  }
  network: {
    downloadBytesPerSec: number
    uploadBytesPerSec: number
  }
  fileSharing: {
    onlineUsers: number
    services: {
      smb: number
      webdav: number
      nfs: number
    }
  }
  cpu: {
    model: string
    usagePercent: number
    frequencyGhz?: number
    temperatureC?: number
    cores: number
    threads: number
    fanRpm?: number
    powerW?: number
  }
  memory: {
    totalBytes: number
    usedBytes: number
    availableBytes: number
    usagePercent: number
    speedMHz: number
    type: string
    manufacturer: string
    partNumber: string
  }
  gpu?: {
    name: string
    usagePercent?: number
    temperatureC?: number
    memoryUsedBytes: number
    memoryTotalBytes: number
    powerW?: number
  }
  checkedAt: string
}

export type NetworkPoint = {
  timestamp: string
  startTime?: string
  endTime?: string
  rxBytes?: number
  txBytes?: number
  rxBytesPerSec: number
  txBytesPerSec: number
  durationSeconds?: number
}

export type NetworkInterfaceSnapshot = {
  name: string
  alias: string
  mac: string
  operState: string
  mtu: number
  ips: string[]
  linkSpeedMbps?: number
  linkSpeedMbit?: number
  linkSpeedBitsPerSec?: number
  speedMbps?: number
  speedMbit?: number
  speedMb?: number
  speedBitsPerSec?: number
  speed: {
    rxBytesPerSec: number
    txBytesPerSec: number
  }
  points?: NetworkPoint[]
}

export type NetworkInterfacesSnapshot = {
  range: string
  stepSeconds: number
  interfaces: NetworkInterfaceSnapshot[]
  checkedAt: string
}

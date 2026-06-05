export interface HardwareSnapshot {
  system: {
    deviceName: string
    hostname: string
    osVersion: string
    kernelVersion: string
    uptimeSeconds: number
  }
  cpu: {
    model: string
    usagePercent: number
    frequencyGhz: number
    temperatureC: number | null
    cores: number
    threads: number
    fanRpm?: number | null
    powerW?: number | null
  }
  motherboard: {
    manufacturer: string
    product: string
    version: string
    serial: string
  }
  memory: {
    totalBytes: number
    usedBytes: number
    availableBytes: number
    usagePercent: number
    pressurePercent: number
    type: string
    speedMHz: number
    manufacturer: string
    partNumber: string
  }
  disks: HardwareDisk[]
  gpus: HardwareGpu[]
  networkInterfaces: HardwareNetworkInterface[]
  checkedAt: string
}

export interface HardwareDisk {
  path: string
  name: string
  kernelName?: string
  model: string
  serial?: string
  vendor?: string
  transport?: string
  usage?: string
  inUse?: boolean
  sizeBytes: number
  temperatureC: number | null
  health: string
  smartAvailable?: boolean
  smartPassed?: boolean
  powerOnHours?: number
  powerCycleCount?: number
  readBytesPerSec: number
  writeBytesPerSec: number
}

export interface HardwareGpu {
  name: string
  vendor: string
  usagePercent?: number | null
  temperatureC?: number | null
  memoryUsedBytes: number
  memoryTotalBytes: number
  powerW?: number | null
}

export interface HardwareNetworkInterface {
  name: string
  mac: string
  operState: string
  mtu: number
  ips: string[]
  speed: {
    rxBytesPerSec: number
    txBytesPerSec: number
  }
}

'use client'

import { SideDrawer } from '@/components/ui'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import type { StorageDrawerKey } from '../../types'
import { DiskDetailDrawer } from '../disk-detail-drawer'
import { NetworkStorageCreator } from '../network-storage-creator'
import { StoragePoolCreator } from '../storage-pool-creator'
import { StoragePoolDetail } from '../storage-pool-detail'
import { StorageSnapshotManager } from '../storage-snapshot-manager'
import type {
  CreatePoolPayload,
  ReplaceDiskPayload,
  RestoreSnapshotPayload,
  SnapshotPolicyPayload,
} from '../../hooks/useStorageActions'

interface DrawerController {
  activeKey: StorageDrawerKey | null
  open: <Payload = unknown>(key: StorageDrawerKey, payload?: Payload) => void
  close: (key?: StorageDrawerKey) => void
  clearPayload: (key: StorageDrawerKey) => void
}

interface ReplaceCandidate {
  path: string
  label: string
  sizeBytes: number
  kind: 'disk' | 'partition'
}

interface StorageDrawersProps {
  drawers: DrawerController
  detailDisk: DiskModel | null
  activePool: StoragePoolModel | null
  snapshotPool: StoragePoolModel | null
  diskList: DiskModel[]
  poolList: StoragePoolModel[]
  replaceCandidates: ReplaceCandidate[]
  creatorSession: number
  onCreatorSessionBump: () => void
  onCreateStoragePool: (payload: CreatePoolPayload) => Promise<void>
  onNetworkStorageConnected: (storageId: string, storage?: Record<string, unknown>) => void
  onCreateSnapshot: (pool: StoragePoolModel) => void
  onRestoreSnapshot: (pool: StoragePoolModel, snapshotId: string, payload: RestoreSnapshotPayload) => Promise<void>
  onUpdateSnapshotPolicy: (pool: StoragePoolModel, payload: SnapshotPolicyPayload) => Promise<boolean | undefined>
  onReplaceDisk: (pool: StoragePoolModel, payload: ReplaceDiskPayload) => Promise<void>
}

export function StorageDrawers({
  drawers,
  detailDisk,
  activePool,
  snapshotPool,
  diskList,
  poolList,
  replaceCandidates,
  creatorSession,
  onCreatorSessionBump,
  onCreateStoragePool,
  onNetworkStorageConnected,
  onCreateSnapshot,
  onRestoreSnapshot,
  onUpdateSnapshotPolicy,
  onReplaceDisk,
}: StorageDrawersProps) {
  return (
    <>
      <DiskDetailDrawer
        disk={detailDisk}
        storagePools={poolList}
        open={drawers.activeKey === 'disk'}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('disk')
            return
          }
          drawers.close('disk')
          drawers.clearPayload('disk')
        }}
      />

      <SideDrawer
        open={drawers.activeKey === 'creator'}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('creator')
            return
          }
          drawers.close('creator')
          onCreatorSessionBump()
        }}
        title="Create Storage Pool"
        onAfterOpen={() => {
          document.getElementById('storage-pool-name')?.focus()
        }}
        className="p-0"
      >
        <StoragePoolCreator key={creatorSession} disks={diskList} onSubmit={onCreateStoragePool} />
      </SideDrawer>

      <SideDrawer
        open={drawers.activeKey === 'networkCreator'}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('networkCreator')
            return
          }
          drawers.close('networkCreator')
        }}
        title="添加网络存储"
        className="p-0"
      >
        <NetworkStorageCreator
          onCancel={() => drawers.close('networkCreator')}
          onConnected={onNetworkStorageConnected}
        />
      </SideDrawer>

      <StoragePoolDetail
        open={drawers.activeKey === 'poolDetail'}
        activePool={activePool}
        replaceCandidates={replaceCandidates}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('poolDetail')
            return
          }
          drawers.close('poolDetail')
          drawers.clearPayload('poolDetail')
        }}
        onReplaceDisk={onReplaceDisk}
      />

      <StorageSnapshotManager
        open={drawers.activeKey === 'snapshotManager'}
        activePool={snapshotPool}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('snapshotManager')
            return
          }
          drawers.close('snapshotManager')
          drawers.clearPayload('snapshotManager')
        }}
        onCreateSnapshot={(pool) => {
          drawers.close('snapshotManager')
          drawers.clearPayload('snapshotManager')
          window.setTimeout(() => {
            onCreateSnapshot(pool)
          }, 220)
        }}
        onRestoreSnapshot={onRestoreSnapshot}
        onUpdateSnapshotPolicy={onUpdateSnapshotPolicy}
      />
    </>
  )
}

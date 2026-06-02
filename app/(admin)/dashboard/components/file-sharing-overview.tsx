import { FolderOpen, Share2, Upload, UploadCloud } from 'lucide-react'

import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { SystemStatusSnapshot } from '@/types'

const uploadingFiles = [
  {
    name: '家庭相册备份.zip',
    type: 'ZIP',
    size: '2.4 GB',
    progress: 73,
  },
  {
    name: '设计稿归档.sketch',
    type: 'SK',
    size: '486 MB',
    progress: 100,
  },
  {
    name: '会议录音.m4a',
    type: 'M4A',
    size: '128 MB',
    progress: 42,
  },
]

const fileShareResources = [
  {
    name: '家庭共享',
    protocol: 'SMB / WebDAV',
    files: 125,
    size: '32.1 GB',
    users: [
      { name: 'DJ', color: 'bg-sky-500' },
      { name: 'LY', color: 'bg-violet-500' },
      { name: 'QY', color: 'bg-emerald-500' },
    ],
  },
  {
    name: '媒体中心',
    protocol: 'SMB',
    files: 68,
    size: '15.6 GB',
    users: [
      { name: 'MX', color: 'bg-amber-500' },
      { name: 'AL', color: 'bg-rose-500' },
    ],
  },
  {
    name: '远程同步',
    protocol: 'WebDAV / NFS',
    files: 97,
    size: '12.4 GB',
    users: [
      { name: 'IP', color: 'bg-cyan-500' },
      { name: 'NAS', color: 'bg-indigo-500' },
      { name: 'TV', color: 'bg-teal-500' },
      { name: 'MB', color: 'bg-fuchsia-500' },
    ],
  },
]

export function FileSharingOverview({ snapshot }: { snapshot: SystemStatusSnapshot | null }) {
  const onlineUsers = snapshot?.fileSharing.onlineUsers
  const services = snapshot?.fileSharing.services

  return (
    <section className="grid gap-3 xl:grid-cols-[0.72fr_1.28fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-app-border flex items-center justify-between gap-3 border-b p-3">
          <div>
            <h2 className="text-app-text text-sm font-semibold">正在上传</h2>
            <p className="text-app-text-muted mt-1 text-xs">上传任务预览，等待上传接口接入</p>
          </div>
          <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-500">
            <UploadCloud className="size-3.5" />
          </span>
        </div>

        <div className="p-3">
          <div className="space-y-2">
            {uploadingFiles.map((file) => (
              <div key={file.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <span className="bg-app-hover text-app-text-muted grid size-9 place-items-center rounded-lg text-[10px] font-semibold">
                  {file.type}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-app-text truncate text-xs font-semibold">{file.name}</p>
                    <span className="text-app-text-muted shrink-0 text-[10px]">{file.size}</span>
                  </div>
                  <div className="bg-app-hover mt-2 h-1.5 rounded-full">
                    <div
                      className={cn('h-1.5 rounded-full', file.progress === 100 ? 'bg-emerald-500' : 'bg-sky-500')}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn('text-xs font-semibold', file.progress === 100 ? 'text-emerald-500' : 'text-app-text')}
                >
                  {file.progress === 100 ? '完成' : `${file.progress}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="border-app-border flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-app-text text-sm font-semibold">文件共享信息</h2>
            <p className="text-app-text-muted mt-1 text-xs">
              {snapshot ? '协议服务运行状态与共享目录访问概览' : '等待接口数据，资源列表为样式预览'}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <ShareStat label="在线" value={snapshot ? String(onlineUsers) : '-'} />
            <ShareStat label="SMB" value={snapshot ? String(services?.smb) : '-'} />
            <ShareStat label="WebDAV" value={snapshot ? String(services?.webdav) : '-'} />
            <ShareStat label="NFS" value={snapshot ? String(services?.nfs) : '-'} />
          </div>
        </div>

        <div className="space-y-2 p-3">
          {fileShareResources.map((resource) => (
            <div
              key={resource.name}
              className="border-app-border bg-app-bg grid gap-3 rounded-lg border p-2.5 md:grid-cols-[minmax(0,1.2fr)_0.6fr_0.5fr_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-400">
                  <FolderOpen className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-app-text truncate text-xs font-semibold">{resource.name}</p>
                  <p className="text-app-text-muted mt-1 truncate text-[10px]">{resource.protocol}</p>
                </div>
              </div>
              <InfoPair label="文件" value={`${resource.files} 个`} />
              <InfoPair label="容量" value={resource.size} />
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <AvatarStack users={resource.users} max={3} />
                <button
                  type="button"
                  className="bg-app-hover text-app-text-muted hover:text-app-text inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs transition"
                >
                  <Share2 className="size-3" />
                  共享
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-bg min-w-14 rounded-md px-2 py-1.5 text-center">
      <div className="text-app-text text-xs font-semibold">{value}</div>
      <div className="text-app-text-muted text-[10px]">{label}</div>
    </div>
  )
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-app-text-muted text-[10px]">{label}</p>
      <p className="text-app-text mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  )
}

function AvatarStack({ users, max = 3 }: { users: Array<{ name: string; color: string }>; max?: number }) {
  const visibleUsers = users.slice(0, max)
  const hiddenCount = Math.max(users.length - visibleUsers.length, 0)

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <span
          key={user.name}
          title={user.name}
          className={cn(
            'border-app-bg text-app-text grid size-7 place-items-center rounded-full border-2 text-[10px] font-semibold',
            user.color,
          )}
        >
          {user.name.slice(0, 2)}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="border-app-bg grid size-7 place-items-center rounded-full border-2 bg-sky-500 text-[10px] font-semibold text-white">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

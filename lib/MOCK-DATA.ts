import { Task, FileNode, StorageDrive } from '@/types'
import {
  FILE_NODES,
  MIMES,
  STORAGE_TYPES,
  DRIVE_STATUSES,
  TASK_STATUSES,
} from '@/types/models/_constants'

export const MOCK_TASKS: Task[] = [
  {
    id: 1,
    name: '文件上传',
    size: '25分钟',
    progress: 45,
    status: TASK_STATUSES.RUNNING, // Use shared task status constants
    updatedAt: '2026-01-24 14:30',
  },
  {
    id: 2,
    name: '文件上传',
    size: '1小时',
    progress: 100,
    status: TASK_STATUSES.SUCCESS,
    updatedAt: '2026-01-24 12:15',
  },
  {
    id: 3,
    name: '数据同步',
    size: '2小时',
    progress: 12,
    status: TASK_STATUSES.RUNNING,
    updatedAt: '2026-01-24 15:05',
  },
  {
    id: 4,
    name: '碎片整理',
    size: '1小时23分钟',
    progress: 0,
    status: TASK_STATUSES.FAILED,
    updatedAt: '2026-01-24 10:00',
  },
  {
    id: 5,
    name: '磁盘格式化',
    size: '23秒',
    progress: 100,
    status: TASK_STATUSES.SUCCESS,
    updatedAt: '2026-01-23 18:45',
  },
  {
    id: 6,
    name: '上传文件',
    size: '13秒',
    progress: 100,
    status: TASK_STATUSES.CANCELED,
    updatedAt: '2026-01-13 18:45',
  },
]
export const MOCK_FILE_NODES: FileNode[] = Array.from(
  { length: 100 },
  (_, i) => {
    const id = (i + 1).toString()
    const isFolder = i < 15 || (i > 40 && i < 45) // Treat the first 15 and middle 5 entries as folders
    const date = new Date(2024, 0, 1).getTime() + i * 100000000 // Generate timestamps in ascending order
    const updatedDate = new Date(date + 50000000)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 16)
    const createdDate = new Date(date)
      .toISOString()
      .replace('T', ' ')
      .slice(0, 16)

    if (isFolder) {
      const folderNames = [
        '项目归档',
        '设计素材',
        '财务报表',
        '个人照片',
        '核心代码',
        '会议记录',
        '参考资料',
        '临时备份',
        '客户方案',
        '学习笔记',
      ]
      return {
        id,
        name: `${folderNames[i % folderNames.length]}_${id}`,
        type: FILE_NODES.FOLDER,
        updatedAt: updatedDate,
        createdAt: createdDate,
        childrenCount: Math.floor(Math.random() * 50),
        isShared: i % 5 === 0,
        isFavorite: i % 7 === 0,
      }
    }

    // File branch
    const fileConfigs = [
      { ext: 'pdf', mime: MIMES.APPLICATION_PDF, name: '研究报告' },
      { ext: 'jpeg', mime: MIMES.IMAGE_JPEG, name: '实拍图', hasThumb: true },
      { ext: 'png', mime: MIMES.IMAGE_PNG, name: '截屏', hasThumb: true },
      {
        ext: 'docx',
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: '合同草案',
      },
      { ext: 'mp4', mime: 'video/mp4', name: '演示视频' },
      { ext: 'zip', mime: 'application/zip', name: '全量备份' },
    ]

    const config = fileConfigs[i % fileConfigs.length]

    return {
      id,
      name: `${config.name}_${id}.${config.ext}`,
      type: FILE_NODES.FILE,
      updatedAt: updatedDate,
      createdAt: createdDate,
      size: Math.floor(Math.random() * 1024 * 1024 * 100), // Up to 100 MB
      extension: config.ext,
      mimeType: config.mime,
      isFavorite: i % 3 === 0,
      isShared: i % 10 === 0,
      thumbnail: config.hasThumb
        ? `https://picsum.photos/seed/node${id}/400/300`
        : undefined,
    }
  },
)
export const MOCK_STORAGES: StorageDrive[] = [
  {
    id: 'dropbox-001',
    name: 'Dropbox',
    type: STORAGE_TYPES.DROPBOX,
    source: 'liaoliaoisleo@gmail.com',
    used: 45 * 1024 * 1024 * 1024,
    total: 100 * 1024 * 1024 * 1024,
    status: DRIVE_STATUSES.ONLINE, // Use shared drive status constants
    mountPath: '/mnt/dropbox',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-20T10:30:00Z',
  },
  {
    id: 'google-drive-001',
    name: 'Google Drive',
    type: STORAGE_TYPES.GOOGLE,
    source: 'liaoliaoisleo@gmail.com',
    used: 15 * 1024 * 1024 * 1024,
    total: 15 * 1024 * 1024 * 1024,
    status: DRIVE_STATUSES.ERROR,
    mountPath: '/mnt/gdrive',
    createdAt: '2023-12-15T08:00:00Z',
    updatedAt: '2024-02-21T12:00:00Z',
  },
  {
    id: 'local-nas-001',
    name: '家庭存储服务器',
    type: STORAGE_TYPES.LOCAL,
    source: '/dev/sdb1',
    used: 1.2 * 1024 * 1024 * 1024 * 1024,
    total: 4 * 1024 * 1024 * 1024 * 1024,
    status: DRIVE_STATUSES.SYNCING,
    mountPath: '/volume1/data',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2024-02-21T15:45:00Z',
  },
]

import { List, PlayCircle, CheckCircle2, AlertCircle } from 'lucide-react'

/** * 1. 业务状态映射 (Single Source of Truth)
 * 以后后端如果把 'complete' 改成 'finished'，你只需要改这一处
 */
export const TASK_STATUS_MAP = {
  UPLOADING: 'uploading',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

/** * 2. 状态 UI 配置
 * 负责所有的颜色、文字显示
 */
export const TASK_STATUS_UI = {
  [TASK_STATUS_MAP.UPLOADING]: {
    color: 'blue',
    label: '进行中',
    icon: PlayCircle,
  },
  [TASK_STATUS_MAP.COMPLETE]: {
    color: 'green',
    label: '已完成',
    icon: CheckCircle2,
  },
  [TASK_STATUS_MAP.ERROR]: { color: 'red', label: '失败', icon: AlertCircle },
} as const

/** * 3. 过滤器定义
 * 驱动 ToggleButton 的渲染
 */
export const TASK_FILTERS = [
  { key: 'all', label: '全部', icon: List, target: null },
  {
    key: 'process',
    label: '进行中',
    icon: PlayCircle,
    target: TASK_STATUS_MAP.UPLOADING,
  },
  {
    key: 'success',
    label: '已完成',
    icon: CheckCircle2,
    target: TASK_STATUS_MAP.COMPLETE,
  },
  {
    key: 'fail',
    label: '失败',
    icon: AlertCircle,
    target: TASK_STATUS_MAP.ERROR,
  },
] as const

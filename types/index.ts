/**
 * @description 排序方向常量
 */
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const

/**
 * @description 排序方向类型
 */
export type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS] | null

/**
 * @description 排序配置项
 * @template T - 目标数据模型类型
 */
export interface SortConfig<T = any> {
  key: keyof T
  dir: SortDirection
}

/**
 * @description 视图呈现模式
 * @enum {string} - GRID: 网格布局 | LIST: 列表布局
 * @usage 切换文件浏览视图时使用，受控于 Toolbar 的 ToggleButton
 */
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
} as const

/**
 * @description 视图模式类型
 * @derived 从 {@link VIEW_MODE} 自动提取，保证单一事实来源
 */
export type ViewMode = (typeof VIEW_MODES)[keyof typeof VIEW_MODES]

export * from './models/task'
export * from './models/job'
export * from './models/file'

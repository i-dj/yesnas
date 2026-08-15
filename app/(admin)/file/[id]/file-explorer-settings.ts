import type { FileExplorerLocale } from '@nextdj/file-explorer'

export const STORAGE_DIRECTORY_BREADCRUMB_ID = '__yesnas_storage_directory__'

const FILE_EXPLORER_LOCALE_MAP: Record<string, FileExplorerLocale> = {
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  zh: 'zh-CN',
  'zh-CN': 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh-Hans-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'zh-HK': 'zh-TW',
  'zh-MO': 'zh-TW',
  'zh-Hant': 'zh-TW',
  'zh-Hant-TW': 'zh-TW',
  ja: 'ja',
  'ja-JP': 'ja',
  ko: 'ko',
  'ko-KR': 'ko',
  fr: 'fr',
  'fr-FR': 'fr',
  de: 'de',
  'de-DE': 'de',
  es: 'es',
  'es-ES': 'es',
  'pt-BR': 'pt-BR',
  ru: 'ru',
  'ru-RU': 'ru',
}

export const getFileExplorerLocale = (locale: string): FileExplorerLocale =>
  FILE_EXPLORER_LOCALE_MAP[locale] ?? FILE_EXPLORER_LOCALE_MAP[locale.split('-')[0]] ?? 'en'

export const FILE_ACTION_TEXT = {
  storage: '存储',
  conflictTitle: '发现同名项目',
  conflictDescriptionPrefix: '目标文件夹里已经存在',
  conflictDescriptionSuffix: '是否覆盖已有',
  folder: '文件夹',
  file: '文件',
  overwrite: '覆盖',
  doNotOverwrite: '不覆盖',
  keepBothTitle: '保留两个项目？',
  keepBothPrefix: '是否自动重命名新项目，让',
  keepBothSuffix: '两者都保留？',
  keepBoth: '两者都保留',
  cancel: '取消',
  actionFailed: '文件操作失败',
  folderCreated: '已创建文件夹',
  sameNameExists: '已存在',
  renameSuccess: '重命名成功',
  deleteTitle: '删除文件',
  deleteConfirmPrefix: '确定要把',
  deleteConfirmSuffix: '个项目移入回收站吗？',
  delete: '删除',
  movedToTrash: '已移入回收站',
  copySuccess: '复制成功',
  moveSuccess: '移动成功',
} as const

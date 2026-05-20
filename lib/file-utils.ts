import {
  FileText,
  Image,
  Video,
  Music,
  Code,
  FileIcon,
  Text,
  Database,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FileAudio2,
  FileVideo,
  Disc3,
} from 'lucide-react'

// File type lookup table
const EXT_MAP = {
  // Documents
  pdf: { Icon: FileText, color: 'text-red-500' },
  doc: { Icon: FileText, color: 'text-blue-500' },
  docx: { Icon: FileText, color: 'text-blue-500' },
  rtf: { Icon: FileText, color: 'text-blue-500' },
  odt: { Icon: FileText, color: 'text-blue-500' },
  txt: { Icon: FileText, color: 'text-slate-500' },
  md: { Icon: Text, color: 'text-slate-500' },
  markdown: { Icon: Text, color: 'text-slate-500' },
  log: { Icon: Text, color: 'text-slate-500' },
  readme: { Icon: Text, color: 'text-slate-500' },

  // Office / Spreadsheet
  xls: { Icon: FileSpreadsheet, color: 'text-emerald-600' },
  xlsx: { Icon: FileSpreadsheet, color: 'text-emerald-600' },
  csv: { Icon: FileSpreadsheet, color: 'text-emerald-600' },
  tsv: { Icon: FileSpreadsheet, color: 'text-emerald-600' },
  ods: { Icon: FileSpreadsheet, color: 'text-emerald-600' },
  ppt: { Icon: FileText, color: 'text-orange-500' },
  pptx: { Icon: FileText, color: 'text-orange-500' },

  // Media
  jpg: { Icon: Image, color: 'text-green-500' },
  jpeg: { Icon: Image, color: 'text-green-500' },
  png: { Icon: Image, color: 'text-green-500' },
  gif: { Icon: Image, color: 'text-green-500' },
  webp: { Icon: Image, color: 'text-green-500' },
  bmp: { Icon: Image, color: 'text-green-500' },
  svg: { Icon: Image, color: 'text-green-500' },
  heic: { Icon: Image, color: 'text-green-500' },
  heif: { Icon: Image, color: 'text-green-500' },
  mp4: { Icon: Video, color: 'text-purple-500' },
  mov: { Icon: FileVideo, color: 'text-purple-500' },
  mkv: { Icon: FileVideo, color: 'text-purple-500' },
  avi: { Icon: FileVideo, color: 'text-purple-500' },
  webm: { Icon: FileVideo, color: 'text-purple-500' },
  mp3: { Icon: Music, color: 'text-pink-500' },
  wav: { Icon: FileAudio2, color: 'text-pink-500' },
  flac: { Icon: FileAudio2, color: 'text-pink-500' },
  m4a: { Icon: FileAudio2, color: 'text-pink-500' },
  aac: { Icon: FileAudio2, color: 'text-pink-500' },
  ogg: { Icon: FileAudio2, color: 'text-pink-500' },

  // Archives
  zip: { Icon: FileArchive, color: 'text-amber-600' },
  rar: { Icon: FileArchive, color: 'text-amber-600' },
  '7z': { Icon: FileArchive, color: 'text-amber-600' },
  iso: { Icon: Disc3, color: 'text-amber-600' },
  img: { Icon: FileArchive, color: 'text-amber-600' },
  dmg: { Icon: FileArchive, color: 'text-amber-600' },
  ipa: { Icon: FileArchive, color: 'text-amber-600' },
  tar: { Icon: FileArchive, color: 'text-amber-600' },
  gz: { Icon: FileArchive, color: 'text-amber-600' },
  tgz: { Icon: FileArchive, color: 'text-amber-600' },
  bz2: { Icon: FileArchive, color: 'text-amber-600' },
  xz: { Icon: FileArchive, color: 'text-amber-600' },

  // Code
  ts: { Icon: Code, color: 'text-blue-600' },
  tsx: { Icon: Code, color: 'text-cyan-500' },
  js: { Icon: FileCode, color: 'text-yellow-500' },
  jsx: { Icon: FileCode, color: 'text-cyan-500' },
  mjs: { Icon: FileCode, color: 'text-yellow-500' },
  cjs: { Icon: FileCode, color: 'text-yellow-500' },
  py: { Icon: FileCode, color: 'text-blue-500' },
  go: { Icon: FileCode, color: 'text-sky-500' },
  rs: { Icon: FileCode, color: 'text-orange-500' },
  java: { Icon: FileCode, color: 'text-amber-600' },
  kt: { Icon: FileCode, color: 'text-violet-500' },
  swift: { Icon: FileCode, color: 'text-orange-500' },
  c: { Icon: FileCode, color: 'text-blue-500' },
  h: { Icon: FileCode, color: 'text-blue-500' },
  cpp: { Icon: FileCode, color: 'text-blue-500' },
  hpp: { Icon: FileCode, color: 'text-blue-500' },
  cs: { Icon: FileCode, color: 'text-violet-500' },
  php: { Icon: FileCode, color: 'text-indigo-500' },
  rb: { Icon: FileCode, color: 'text-red-500' },
  sh: { Icon: FileCode, color: 'text-slate-500' },
  bash: { Icon: FileCode, color: 'text-slate-500' },
  zsh: { Icon: FileCode, color: 'text-slate-500' },

  // Data / Config
  json: { Icon: FileJson, color: 'text-amber-500' },
  jsonc: { Icon: FileJson, color: 'text-amber-500' },
  yaml: { Icon: FileJson, color: 'text-indigo-500' },
  yml: { Icon: FileJson, color: 'text-indigo-500' },
  toml: { Icon: FileJson, color: 'text-indigo-500' },
  xml: { Icon: FileCode, color: 'text-orange-500' },
  ini: { Icon: FileCode, color: 'text-slate-500' },
  conf: { Icon: FileCode, color: 'text-slate-500' },
  env: { Icon: FileCode, color: 'text-slate-500' },

  // Database
  sql: { Icon: Database, color: 'text-orange-600' },
  db: { Icon: Database, color: 'text-orange-600' },
  sqlite: { Icon: Database, color: 'text-orange-600' },
  sqlite3: { Icon: Database, color: 'text-orange-600' },
} as const

// Returns the UI config for a file name
export const getFileConfig = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() as keyof typeof EXT_MAP
  // Fast O(1) lookup
  return EXT_MAP[ext] || { Icon: FileIcon, color: 'text-neutral-400' }
}

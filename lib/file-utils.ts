import {
  FileText,
  Image,
  Video,
  Music,
  Code,
  FileIcon,
  Text,
  Database,
} from 'lucide-react'

// File type lookup table
const EXT_MAP = {
  // Documents
  pdf: { Icon: FileText, color: 'text-red-500' },
  doc: { Icon: FileText, color: 'text-blue-500' },
  docx: { Icon: FileText, color: 'text-blue-500' },
  txt: { Icon: FileText, color: 'text-slate-500' },
  // Media
  jpg: { Icon: Image, color: 'text-green-500' },
  jpeg: { Icon: Image, color: 'text-green-500' },
  png: { Icon: Image, color: 'text-green-500' },
  mp4: { Icon: Video, color: 'text-purple-500' },
  mp3: { Icon: Music, color: 'text-pink-500' },
  // Code
  ts: { Icon: Code, color: 'text-blue-600' },
  tsx: { Icon: Code, color: 'text-cyan-500' },
  md: { Icon: Text, color: 'text-black-600' },
  sql: { Icon: Database, color: 'text-orange-600' },
} as const

// Returns the UI config for a file name
export const getFileConfig = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() as keyof typeof EXT_MAP
  // Fast O(1) lookup
  return EXT_MAP[ext] || { Icon: FileIcon, color: 'text-neutral-400' }
}

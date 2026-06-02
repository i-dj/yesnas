'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'

type Process = {
  PID: number
  USER: string
  PRI: number
  NI: number
  VIRT: number
  RES: number
  SHR: number
  S: string
  CPU: number
  MEM: number
  TIME: string
  Command: string
}

const initialData: Process[] = [
  {
    PID: 123,
    USER: 'root',
    PRI: 20,
    NI: 0,
    VIRT: 102400,
    RES: 51200,
    SHR: 1024,
    S: 'S',
    CPU: 1.2,
    MEM: 0.5,
    TIME: '00:01:23',
    Command: 'nginx',
  },
  {
    PID: 456,
    USER: 'user',
    PRI: 20,
    NI: 0,
    VIRT: 204800,
    RES: 102400,
    SHR: 2048,
    S: 'R',
    CPU: 3.5,
    MEM: 1.2,
    TIME: '00:05:12',
    Command: 'node app.js',
  },
  {
    PID: 7894,
    USER: 'admin',
    PRI: 15,
    NI: 0,
    VIRT: 51200,
    RES: 25600,
    SHR: 512,
    S: 'S',
    CPU: 0.5,
    MEM: 0.2,
    TIME: '00:00:45',
    Command: 'htop',
  },
  {
    PID: 7893,
    USER: 'admin',
    PRI: 15,
    NI: 0,
    VIRT: 51200,
    RES: 25600,
    SHR: 512,
    S: 'S',
    CPU: 0.5,
    MEM: 0.2,
    TIME: '00:00:45',
    Command: 'htop',
  },
  {
    PID: 7892,
    USER: 'admin',
    PRI: 15,
    NI: 0,
    VIRT: 51200,
    RES: 25600,
    SHR: 512,
    S: 'S',
    CPU: 0.5,
    MEM: 0.2,
    TIME: '00:00:45',
    Command: 'htop',
  },
  {
    PID: 7891,
    USER: 'admin',
    PRI: 15,
    NI: 0,
    VIRT: 51200,
    RES: 25600,
    SHR: 512,
    S: 'S',
    CPU: 0.5,
    MEM: 0.2,
    TIME: '00:00:45',
    Command: 'htop',
  },
]

type SortKey = keyof Process

export const HtopTable = () => {
  const [processes, setProcesses] = useState<Process[]>(initialData)
  const [sortKey, setSortKey] = useState<SortKey>('PID')
  const [ascending, setAscending] = useState(true)

  const handleSort = (key: SortKey) => {
    let newAscending = true
    if (sortKey === key) {
      newAscending = !ascending
    }
    setSortKey(key)
    setAscending(newAscending)

    const sorted = [...processes].sort((a, b) => {
      const valA = a[key]
      const valB = b[key]

      if (typeof valA === 'number' && typeof valB === 'number') {
        return newAscending ? valA - valB : valB - valA
      }

      return newAscending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA))
    })

    setProcesses(sorted)
  }

  const headers: SortKey[] = ['PID', 'USER', 'PRI', 'NI', 'VIRT', 'RES', 'SHR', 'S', 'CPU', 'MEM', 'TIME', 'Command']

  return (
    <div className="overflow-auto font-mono text-sm">
      <div className="grid grid-cols-[60px_80px_60px_60px_80px_80px_60px_60px_60px_60px_80px_1fr] border-b border-gray-400">
        {headers.map((header) => (
          <div
            key={header}
            className={cn(
              'cursor-pointer px-2 py-1 select-none',
              sortKey === header ? 'bg-neutral-300 dark:bg-neutral-700' : '',
            )}
            onClick={() => handleSort(header)}
          >
            {header}
            {sortKey === header && (ascending ? ' ▲' : ' ▼')}
          </div>
        ))}
      </div>
      {processes.map((proc) => (
        <div
          key={proc.PID}
          className="grid grid-cols-[60px_80px_60px_60px_80px_80px_60px_60px_60px_60px_80px_1fr] border-b border-gray-200 dark:border-gray-700"
        >
          <div className="px-2 py-1">{proc.PID}</div>
          <div className="px-2 py-1">{proc.USER}</div>
          <div className="px-2 py-1">{proc.PRI}</div>
          <div className="px-2 py-1">{proc.NI}</div>
          <div className="px-2 py-1">{proc.VIRT}</div>
          <div className="px-2 py-1">{proc.RES}</div>
          <div className="px-2 py-1">{proc.SHR}</div>
          <div className="px-2 py-1">{proc.S}</div>
          <div className="px-2 py-1">{proc.CPU}</div>
          <div className="px-2 py-1">{proc.MEM}</div>
          <div className="px-2 py-1">{proc.TIME}</div>
          <div className="px-2 py-1">{proc.Command}</div>
        </div>
      ))}
    </div>
  )
}

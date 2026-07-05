'use client'

import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from './form/input'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, type = 'search', ...props }, ref) => (
    <div className={cn('relative w-full min-w-0', wrapperClassName)}>
      <Search
        className="text-app-text-muted pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type={type}
        variant="search"
        className={className}
        {...props}
      />
    </div>
  ),
)

SearchInput.displayName = 'SearchInput'

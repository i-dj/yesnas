'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

import { cn } from '@/lib/utils'

type SelectOption = {
  value: string
  label: ReactNode
  disabled: boolean
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'defaultValue' | 'multiple' | 'onChange' | 'value'
> {
  children: ReactNode
  value?: string | number
  defaultValue?: string | number
  wrapperClassName?: string
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  onValueChange?: (value: string) => void
}

export function Select({
  className,
  wrapperClassName,
  children,
  value,
  defaultValue,
  id,
  disabled,
  name,
  required,
  onChange,
  onValueChange,
  ...props
}: SelectProps) {
  const options = useMemo(() => getOptions(children), [children])
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = useState(() => String(defaultValue ?? options[0]?.value ?? ''))
  const selectedValue = controlled ? String(value) : internalValue
  const selectedOption = options.find((option) => option.value === selectedValue)

  const handleValueChange = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue)
    onValueChange?.(nextValue)
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>)
  }

  return (
    <div className={cn('relative min-w-0', wrapperClassName)}>
      {name && <input type="hidden" name={name} value={selectedValue} required={required} />}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger id={id} asChild disabled={disabled}>
          <button
            id={id}
            type="button"
            className={cn(
              'h-8 bg-transparent text-sm',
              'bg-app-bg border-app-border text-app-text focus-visible:border-app-border-strong',
              'app-body-text flex h-9 w-full min-w-0 items-center justify-between gap-3 rounded-md border px-2.5 outline-none',
              'hover:bg-app-hover/45 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-label={props['aria-label']}
          >
            <span className="text-app-text min-w-0 truncate text-left font-normal">
              {selectedOption?.label ?? selectedValue}
            </span>
            <ChevronDown className="text-app-text-muted size-4 shrink-0" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={5}
            collisionPadding={12}
            className={cn(
              'bg-app-bg border-app-border z-50 max-h-72 min-w-(--radix-dropdown-menu-trigger-width)',
              'overflow-y-auto rounded-md border p-1 shadow-xl outline-none',
            )}
          >
            <DropdownMenu.RadioGroup value={selectedValue} onValueChange={handleValueChange}>
              {options.map((option) => (
                <DropdownMenu.RadioItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'text-app-text-muted relative flex min-h-8 cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2.5',
                    'text-[13px] transition-colors outline-none select-none',
                    'data-highlighted:bg-app-hover data-highlighted:text-app-text',
                    'data-[state=checked]:text-app-text data-[state=checked]:font-normal dark:data-[state=checked]:text-sky-300',
                    'data-disabled:pointer-events-none data-disabled:opacity-40',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <DropdownMenu.ItemIndicator className="absolute right-2.5 grid place-items-center">
                    <Check className="size-3.5" />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

function getOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== 'option') return []

    const option = child as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>
    return [
      {
        value: String(option.props.value ?? ''),
        label: option.props.children,
        disabled: Boolean(option.props.disabled),
      },
    ]
  })
}

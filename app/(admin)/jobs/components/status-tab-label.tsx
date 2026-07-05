interface StatusTabLabelProps {
  label: string
  count?: number
  active?: boolean
}

export const StatusTabLabel = ({ label, count, active = false }: StatusTabLabelProps) => (
  <span className="inline-flex items-center gap-1.5">
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none ${
          active ? 'bg-app-bg/80 text-app-text' : 'bg-app-active text-app-text-muted'
        }`}
      >
        {count}
      </span>
    )}
  </span>
)

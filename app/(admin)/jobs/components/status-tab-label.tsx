interface StatusTabLabelProps {
  label: string
  count?: number
}

export const StatusTabLabel = ({ label, count }: StatusTabLabelProps) => (
  <div className="flex items-center gap-2.5">
    <span className="app-body-text font-medium">{label}</span>
    {count !== undefined && (
      <span className="app-micro-label bg-app-active text-app-text-muted grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-medium transition-colors">
        {count}
      </span>
    )}
  </div>
)

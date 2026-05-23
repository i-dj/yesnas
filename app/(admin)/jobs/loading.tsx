export default function JobsLoading() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="bg-app-hover h-8 w-40 animate-pulse rounded" />
      <div className="bg-app-hover h-10 w-full animate-pulse rounded" />
      <div className="border-app-border space-y-2 rounded-lg border p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-app-hover h-16 animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

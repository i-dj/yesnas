export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="bg-app-hover h-8 w-48 animate-pulse rounded" />
      <div className="border-app-border space-y-2 rounded-lg border p-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-app-hover h-14 animate-pulse rounded" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 bg-border rounded-lg w-48 mb-2" />
          <div className="h-4 bg-border rounded w-64" />
        </div>
        <div className="h-9 bg-border rounded-lg w-28" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-border flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-border rounded w-24 mb-2" />
              <div className="h-7 bg-border rounded w-16 mb-1" />
              <div className="h-3 bg-border rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card h-64" />
        <div className="card xl:col-span-2 h-64" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card h-72" />
        <div className="card h-72" />
      </div>
    </div>
  )
}

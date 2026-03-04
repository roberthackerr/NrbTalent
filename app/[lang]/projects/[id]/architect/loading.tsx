// app/projects/[id]/architect/loading.tsx
export default function AIArchitectLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-r from-purple-200 to-blue-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="h-12 bg-gray-100 rounded-lg mb-6 animate-pulse"></div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </main>

      {/* AI thinking animation */}
      <div className="fixed bottom-6 right-6">
        <div className="flex items-center gap-2 p-4 bg-white border rounded-lg shadow-lg">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
            <div className="absolute inset-0 animate-ping bg-purple-300 rounded-full"></div>
          </div>
          <div className="space-y-1">
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 w-24 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
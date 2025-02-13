import { Skeleton } from './skeleton'

export function FeedbackSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      {/* Voters sidebar */}
      <div className="vertical gap-2 hidden md:block">
        <div className="grid grid-cols-[auto_1fr] gap-2 p-4 border rounded-lg">
          <Skeleton className="h-4 w-20 col-span-full mb-2" />
          <Skeleton className="h-3 w-32 col-span-full mb-4" />
          
          <Skeleton className="h-4 w-16 col-span-full mb-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="horizontal gap-2 center-v col-span-full mb-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="vertical grid grid-cols-[auto_1fr] gap-8">
        {/* Title section */}
        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <Skeleton className="size-8" />
          <span className="vertical justify-between">
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-5 w-24" />
          </span>
        </span>

        {/* Author and content section */}
        <span className="horizontal center-v gap-4 grid col-span-full grid-cols-subgrid">
          <span className="horizontal justify-end">
            <Skeleton className="size-6 rounded-full" />
          </span>
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-24 w-full col-start-2" />
          <span className="flex flex-col md:flex-row gap-2 col-start-2">
            <Skeleton className="h-3 w-32" />
            <span className="horizontal center-v gap-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
            </span>
          </span>
        </span>

        {/* Activities section */}
        <div className="col-span-full">
          <div className="horizontal justify-between mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-4 p-4 border rounded-lg">
              <div className="horizontal gap-2 mb-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
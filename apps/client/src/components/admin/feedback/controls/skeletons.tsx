import { Skeleton } from '@/components/skeleton'

export function DetailsSkeleton() {
    return (
        <div className="grid grid-cols-[auto_1fr] gap-1 max-w-full">
            <h1 className="text-sm font-medium col-span-full">Details</h1>
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Public link</p>
            <Skeleton className="h-8 rounded-lg" />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Board</p>
            <Skeleton className="h-8 rounded-lg" />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Status</p>
            <Skeleton className="h-8 rounded-lg" />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Owner</p>
            <Skeleton className="h-8 rounded-lg" />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Estimated</p>
            <Skeleton className="h-8 rounded-lg" />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Category</p>
            <Skeleton className="h-8 rounded-lg" />
        </div>
    )
}

export function TagsSkeleton() {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Tags</h1>
            <Skeleton className="h-4 w-16 col-span-full" />
            <div className="col-span-full flex flex-wrap gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
            </div>
        </div>
    )
}

export function VotersSkeleton() {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Voters</h1>
            <div className="col-span-full">
                <Skeleton className="h-16 rounded-lg" />
            </div>
        </div>
    )
}

export function RoadmapsSkeleton() {
    return (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
            <h1 className="text-sm font-medium col-span-2">Roadmaps</h1>
            <Skeleton className="h-4 w-24" />
            <div className="col-span-full flex flex-wrap gap-2">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-40 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
            </div>
        </div>
    )
} 
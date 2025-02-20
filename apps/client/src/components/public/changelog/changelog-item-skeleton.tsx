import { Icons } from "@/components"
import { Skeleton } from "@/components/skeleton"

export const ChangelogItemSkeleton = () => {
    return (
        <div className='grid grid-cols-subgrid col-span-full'>
            <Skeleton className='h-5 w-32 hidden md:block rounded' />
            
            <div className='vertical gap-2'>
                <Skeleton className='h-7 w-3/4 mb-2 rounded' />
                
                <div className='vertical gap-2 mb-4'>
                    <Skeleton className='h-4 w-full rounded' />
                    <Skeleton className='h-4 w-5/6 rounded' />
                    <Skeleton className='h-4 w-4/6 rounded' />
                </div>

                <span className='horizontal gap-2 center-v'>
                    <Skeleton className='h-8 w-8 rounded' />
                    <Skeleton className='h-4 w-16 rounded' />
                    
                    <span className='ml-auto horizontal gap-2 center-v'>
                        <Icons.ChartNoAxesColumn className='size-6 rounded-full bg-gray-100 dark:bg-zinc-800 p-1' />
                        <Skeleton className='h-4 w-20 rounded' />
                    </span>
                </span>
            </div>
        </div>
    )
} 
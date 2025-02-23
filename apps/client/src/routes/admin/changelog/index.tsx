import { Button, Icons, LoadingSpinner, Skeleton } from '@/components'
import { ChangelogContent } from '@/components/admin/changelog/changelog-renderer'
import { Filters } from '@/components/admin/changelog/filters'
import { changelogsInfiniteQuery } from '@/lib/query'
import { useVisibility, UseVisibility } from '@paulgeorge35/hooks'
import { ChangelogDetailed } from '@repo/database'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { RefObject, useMemo } from 'react'
import { z } from 'zod'

const searchParams = z.object({
    search: z.string().optional(),
    status: z.array(z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED'])).optional(),
    type: z.enum(['ALL', 'NEW', 'IMPROVED', 'FIXED']).optional(),
    labels: z.array(z.string()).optional(),
})

export const Route = createFileRoute('/admin/changelog/')({
    validateSearch: searchParams,
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="pt-18 grid grid-cols-[minmax(200px,250px)_1fr] w-full h-full max-h-full">
            <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
                <div className="vertical">
                    <Link
                        to="/admin/changelog/create"
                        className="p-4 border-b horizontal center-v space-between text-sm font-bold [&>svg]:size-4 [&>svg]:stroke-gray-500 dark:[&>svg]:stroke-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                        Create a new entry
                        <Icons.Plus className="size-4" />
                    </Link>
                    <Filters />
                </div>
            </div>
            <div className='vertical border-x w-1/2 min-w-[400px] bg-white dark:bg-zinc-900 z-10' style={{ transform: 'translate3d(0, 0, 0)' }}>
                <ChangelogList />
            </div>
        </div>
    )
}

function ChangelogList() {
    const search = useSearch({ from: '/admin/changelog/' })
    const { data, isLoading, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(changelogsInfiniteQuery({ ...search, search: search.search }))

    const handleFetchNextPage = (params: UseVisibility<HTMLDivElement>) => {
        if (params.isVisible && data?.pages[data?.pages.length - 1]) {
            fetchNextPage()
        }
    }

    const { ref } = useVisibility<HTMLDivElement>({
        threshold: 50,
    }, handleFetchNextPage)

    const changelogs: ChangelogDetailed[] = useMemo(() => {
        return data?.pages.flatMap(page => page.changelogs ?? []) ?? []
    }, [data])

    if (isLoading) {
        return Array.from({ length: 1 }).map((_, index) => (
            <div key={index} className="w-full h-32 border-b mb-[2px]">
                <Skeleton className="w-full h-full">
                    <div className="w-full h-full vertical center">
                        <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
                    </div>
                </Skeleton>
            </div>
        ))
    }

    if (changelogs.length === 0) {
        return <div className="w-full h-full">
            <span className="w-full h-full vertical center">
                <Icons.MessageSquare className="size-10 stroke-gray-500 dark:stroke-zinc-400" />
                <p className="text-gray-500 dark:text-zinc-400 p-4 text-center font-light">No changelogs found</p>
            </span>
        </div>
    }

    return (
        <>
            {changelogs.map((changelog, index) => (
                <ChangelogCard key={changelog.id} changelog={changelog} ref={index === changelogs.length - 1 ? ref : undefined} />
            ))}
            {isFetchingNextPage && <div className="w-full h-32 border-b mb-[2px]">
                <Skeleton className="w-full h-full vertical center">
                    <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
                </Skeleton>
            </div>}
        </>
    )
}

type ChangelogCardProps = {
    changelog: ChangelogDetailed
    ref?: RefObject<HTMLDivElement>
}

function ChangelogCard({ changelog, ref }: ChangelogCardProps) {
    return (
        <div ref={ref} className="w-full border-b p-4 md:p-8 vertical gap-2 relative">
            <Link to='/admin/changelog/$changelogSlug/edit' params={{ changelogSlug: changelog.slug }} className='absolute top-4 right-4 md:top-8 md:right-8'>
                <Button variant='ghost' size='icon'>
                    <Icons.Pencil className='size-4' />
                </Button>
            </Link>
            <p className='text-sm font-light text-gray-500 dark:text-zinc-500'>
                {changelog.publishedAt ? DateTime.fromJSDate(new Date(changelog.publishedAt)).toFormat('dd MMM yyyy, hh:mm') : 'Unpublished'}
            </p>

            <ChangelogContent changelog={changelog} status={changelog.status} publishedAt={changelog.publishedAt} slug={changelog.slug} preview />
        </div>
    )
}
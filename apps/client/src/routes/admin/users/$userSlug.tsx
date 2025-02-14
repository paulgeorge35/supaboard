import { Icons, LoadingSpinner, Skeleton, StatusBadge } from '@/components';
import { MemberActivity, memberActivityInfiniteQuery } from '@/lib/query/user';
import { cn } from '@/lib/utils';
import { useVisibility, UseVisibility } from '@paulgeorge35/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useParams, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

export const Route = createFileRoute('/admin/users/$userSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  const search = useSearch({ from: Route.fullPath });
  const { userSlug } = useParams({ from: Route.fullPath });

  const { data, isLoading, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(memberActivityInfiniteQuery({
    ...search,
    userId: userSlug,
  }));

  const handleFetchNextPage = (params: UseVisibility<HTMLDivElement>) => {
    if (params.isVisible && data?.pages[data?.pages.length - 1]) {
      fetchNextPage()
    }
  }

  const { ref } = useVisibility<HTMLDivElement>({
    threshold: 50,
  }, handleFetchNextPage)

  const activities: MemberActivity[] = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || []
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

  if (!activities) {
    return <div className="col-span-1 overflow-y-auto border-l bg-white dark:bg-zinc-900 z-10">
      <p className="text-zinc-500 dark:text-zinc-400">No activity found</p>
    </div>
  }

  return (
    <div className="col-span-1 overflow-y-auto border-l bg-white dark:bg-zinc-900 z-10">
      {activities.map((activity, index) => (
        <MemberActivityCard key={activity.id} data={activity} ref={index === activities.length - 1 ? ref : undefined} />
      ))}
      {isFetchingNextPage && <div className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full vertical center">
          <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
        </Skeleton>
      </div>}
    </div>
  )
}

type MemberActivityCardProps = {
  data: MemberActivity;
  ref?: React.RefObject<HTMLDivElement>
}

function MemberActivityCard({ data, ref }: MemberActivityCardProps) {
  return (
    <>
      <Link
        preload={false}
        to={"/admin/feedback/$boardSlug/$feedbackSlug"}
        params={{ boardSlug: data.boardSlug, feedbackSlug: data.slug }}
        activeProps={{ className: "[&>div]:bg-gray-900/5 [&>div]:border-l-2 [&>div]:border-[var(--color-primary)]" }}
      >
        <div ref={ref} className={cn("border-zinc-200 dark:border-zinc-800 horizontal bg-white dark:bg-zinc-900 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200")}>
          <div className='p-4 vertical center gap-1 border-r [&>svg]:fill-gray-300 dark:[&>svg]:fill-zinc-700 [&>svg]:size-5 [&>svg]:stroke-0'>
            {data.posts > 0 && <Icons.Pencil />}
            {data.votes > 0 && <Icons.Triangle />}
            {data.comments > 0 && <Icons.MessageSquare />}
          </div>
          <div className={cn("p-4 vertical gap-2")}>
            <h1 className="text-sm font-medium">{data.title}</h1>
            <p className="text-sm text-gray-500 line-clamp-2">
              {data.description}
            </p>
            <span className="horizontal gap-2 center-v flex-wrap md:flex-nowrap">
              <Icons.Triangle size={12} />
              <span className="text-xs text-gray-500">
                {data.totalVotes}
              </span>
              <Icons.MessageSquare size={12} />
              <span className="text-xs text-gray-500">
                {data.totalComments}
              </span>
              {data.status !== 'OPEN' && (
                <StatusBadge status={data.status} className="ml-auto" />
              )}
            </span>
          </div>
        </div>
      </Link>
      <hr />
    </>
  )
}
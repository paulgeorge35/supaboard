import { Icons, LoadingSpinner } from '@/components'
import { FeedbackCard } from '@/components/admin'
import { Skeleton } from '@/components/skeleton'
import { feedbacksInfiniteQuery } from '@/lib/query/feedback'
import { useDebounce } from '@paulgeorge35/hooks'
import { UseVisibility, useVisibility } from '@paulgeorge35/hooks/lib/esm/useVisibility'
import { FeedbackSummary } from '@repo/database'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/admin/feedback/$boardSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const { value: debouncedSearch } = useDebounce(searchQuery)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <>
      <div id="feedback-list" className="col-span-1 overflow-y-auto border-l bg-white dark:bg-zinc-900 z-10">
        <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900">
            <div className='p-4 border-b sticky top-0 bg-white dark:bg-zinc-900'>
              <span className='pl-2 py-1 horizontal center-v gap-2 bg-gray-100 dark:bg-zinc-800 rounded-md'>
                <Icons.Search className='size-4 stroke-gray-500 dark:stroke-zinc-400' />
                <input type="text" placeholder='Search...' className='w-full focus:outline-none pr-2 py-1 pl-0 md:text-sm font-light' value={searchQuery} onChange={handleChange} />
              </span>
            </div>
            <FeedbackList searchQuery={debouncedSearch} />
          </div>
        </div>
      </div>
      <div className="col-span-1 p-8 relative vertical border-l max-h-[calc(100dvh-72px)] bg-white dark:bg-zinc-900">
        <Outlet />
      </div>
    </>
  )
}

function FeedbackList({ searchQuery }: { searchQuery: string }) {
  const router = useRouter()
  const { boardSlug, feedbackSlug } = useParams({ strict: false })
  const search = useSearch({ from: Route.fullPath })
  const { data, isLoading, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(feedbacksInfiniteQuery({ ...search, search: searchQuery }))

  const handleFetchNextPage = (params: UseVisibility<HTMLDivElement>) => {
    if (params.isVisible && data?.pages[data?.pages.length - 1]) {
      fetchNextPage()
    }
  }

  const { ref } = useVisibility<HTMLDivElement>({
    threshold: 50,
  }, handleFetchNextPage)

  const feedbacks: FeedbackSummary[] = useMemo(() => {
    return data?.pages.flatMap(page => page.feedbacks) || []
  }, [data])

  useEffect(() => {
    if (feedbackSlug && boardSlug) {
      router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug, feedbackSlug }, search, replace: true })
      return;
    }
    if (feedbacks && feedbacks.length > 0) {
      router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug: feedbacks[0].board.slug, feedbackSlug: feedbacks[0].slug }, search, replace: true })
      return;
    }
  }, [boardSlug, feedbackSlug, feedbacks, search])

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

  if (!feedbacks) {
    return <div className="w-full h-full">
      <p className="text-zinc-500 dark:text-zinc-400">Board not found</p>
    </div>
  }

  if (feedbacks.length === 0) {
    return <div className="w-full h-full">
      <span className="w-full h-full vertical center">
        <Icons.MessageSquare className="size-10 stroke-gray-500 dark:stroke-zinc-400" />
        <p className="text-gray-500 dark:text-zinc-400 p-4 text-center font-light">No feedbacks found</p>
      </span>
    </div>
  }

  return (
    <>
      {feedbacks.map((feedback, index) => (
        <FeedbackCard key={feedback.id} feedback={feedback} ref={index === feedbacks.length - 1 ? ref : undefined} />
      ))}
      {isFetchingNextPage && <div className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full vertical center">
          <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
        </Skeleton>
      </div>}
    </>
  )
}


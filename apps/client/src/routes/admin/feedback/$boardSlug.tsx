import { Icons } from '@/components'
import { FeedbackCard } from '@/components/admin'
import { Skeleton } from '@/components/skeleton'
import { feedbacksQuery } from '@/routes/__root'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin/feedback/$boardSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div className=" col-span-1 overflow-y-auto border-l">
        <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900 z-10">
            <FeedbackList />
          </div>
        </div>
      </div>
      <div className="col-span-1 p-8 relative border-l max-h-[calc(100dvh-64px)] bg-white dark:bg-zinc-900">
        <Outlet />
      </div>
    </>
  )
}

function FeedbackList() {
  const router = useRouter()
  const { boardSlug } = useParams({ from: "/admin/feedback/$boardSlug" })
  const search = useSearch({ from: Route.fullPath })
  const { feedbackSlug } = useParams({ strict: false })
  const { data: feedbacks, isLoading } = useQuery(feedbacksQuery(search))

  useEffect(() => {
    if (feedbackSlug) {
      console.log("$boardSlug[1]: Navigating to /admin/feedback/$boardSlug/$feedbackSlug", `boardSlug: ${boardSlug}`, `feedbackSlug: ${feedbackSlug}`)
      router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug, feedbackSlug }, search })
      return;
    }
    if (feedbacks && feedbacks.length > 0) {
      console.log("$boardSlug[2]: Navigating to /admin/feedback/$boardSlug/$feedbackSlug", `boardSlug: ${feedbacks[0].board.slug}`, `feedbackSlug: ${feedbacks[0].slug}`)
      router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug: feedbacks[0].board.slug, feedbackSlug: feedbacks[0].slug }, search })
      return;
    }
  }, [boardSlug, feedbackSlug, feedbacks, search])

  if (isLoading) {
    return Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full" />
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
      {feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.id} {...feedback} />
      ))}
    </>
  )
}


import { FeedbackCard } from '@/components/admin'
import { Skeleton } from '@/components/skeleton'
import { boardQuery } from '@/routes/__root'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Navigate, Outlet, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/feedback/$boardSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  console.log('boardSlug')
  return (
    <>
      <div className=" col-span-1 overflow-y-auto border-l">
        <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900 z-10">
            <FeedbackList />
          </div>
        </div>
      </div>
      <div className="col-span-1 p-8 relative border-l max-h-[calc(100dvh-64px)]">
        <Outlet />
      </div>
    </>
  )
}

function FeedbackList() {
  const { boardSlug, feedbackSlug } = useParams({ strict: false })
  const { data, isLoading } = useQuery(boardQuery(boardSlug))

  if (isLoading) {
    return Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full" />
      </div>
    ))
  }

  if (!data) {
    return <div className="w-full h-full">
      <p className="text-zinc-500 dark:text-zinc-400">Board not found</p>
    </div>
  }

  if (data.feedbacks.length === 0) {
    return <div className="w-full h-full">
      <p className="text-zinc-500 dark:text-zinc-400">No feedback found</p>
    </div>
  }

  return (
    <>
      {data.feedbacks.map((feedback) => (
        <FeedbackCard key={feedback.id} {...feedback} />
      ))}
      {boardSlug && !feedbackSlug && <Navigate to='/admin/feedback/$boardSlug/$feedbackSlug' params={{ boardSlug, feedbackSlug: data.feedbacks[0].slug }} />}
    </>
  )
}


import {
  Boards,
  Categories,
  FeedbackCard,
  Owner,
  Status,
  Tags,
} from '@/components/admin'
import { Skeleton } from '@/components/skeleton'
import { boardQuery } from '@/routes/__root'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/feedback/$boardSlug/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardSlug } = useParams({ from: '/admin/feedback/$boardSlug/' })
  const { data, isLoading } = useQuery(boardQuery(boardSlug))

  console.log('/admin/feedback/$boardSlug/')

  return (
    <div className="grid grid-cols-[minmax(200px,320px)_minmax(300px,360px)_minmax(60%,1fr)] h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">
          <Boards />
          <Status />
          <Tags />
          <Categories />
          <Owner />
        </div>
      </div>
      <div className=" col-span-1 overflow-y-auto border-l">
        <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900 z-10">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-32 border-b mb-[2px]" />
              ))
            ) : (
              data ?
                data?.feedbacks.map((feedback) => (
                  <FeedbackCard key={feedback.id} {...feedback} />
                ))
                : <div className="w-full h-full flex items-center justify-center">
                  <p className="text-zinc-500 dark:text-zinc-400">No feedbacks found</p>
                </div>
            )}
          </div>
        </div>
      </div>
      <div className=" col-span-1 p-8 relative border-l">
        <Outlet />
      </div>
    </div>
  )
}

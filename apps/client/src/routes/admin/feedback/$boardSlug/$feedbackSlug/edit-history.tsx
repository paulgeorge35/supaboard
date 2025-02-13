import { Skeleton } from '@/components'
import { feedbackEditHistoryQuery, feedbackQuery } from '@/lib/query/feedback'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { DateTime } from 'luxon'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug/edit-history',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardSlug, feedbackSlug } = useParams({
    from: '/admin/feedback/$boardSlug/$feedbackSlug/edit-history',
  })
  const { data, isLoading } = useQuery(
    feedbackEditHistoryQuery(boardSlug, feedbackSlug),
  )
  const { data: feedback } = useQuery(
    feedbackQuery(boardSlug, feedbackSlug),
  )

  if (isLoading) return (
    <div className="vertical gap-4 grid grid-cols-[auto_1fr] w-full">
      <h1 className="font-light">Edit History</h1>
      <div className="grid grid-cols-subgrid col-span-full gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="col-span-full h-10" />
        ))}
      </div>
    </div>
  )

  if (!feedback) {
    throw notFound()
  }

  return (
    <div className="vertical gap-4 grid grid-cols-[auto_1fr] w-full">
      <h1 className="font-light">Edit History</h1>
      <div
        key={data?.[0].id}
        className="grid grid-cols-subgrid col-span-full gap-2"
      >
        <p className="text-xs text-gray-500">
          {DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat(
            'MMM d, HH:mm',
          )}
        </p>
        <p className="text-xs">{data?.[0].from.title}</p>
        <p className="text-xs uppercase font-medium w-fit h-fit bg-[var(--color-primary)]/40 px-1 rounded-lg text-[var(--color-primary)]">
          Original
        </p>
        <p className="text-xs col-start-2 text-gray-500">
          {data?.[0].from.description}
        </p>
      </div>
      {data?.map((activity) => (
        <div
          key={activity.id}
          className="grid grid-cols-subgrid col-span-full gap-2"
        >
          <hr className="col-span-full border-dashed" />
          <p className="text-xs text-gray-500">
            {DateTime.fromJSDate(new Date(activity.createdAt)).toFormat(
              'MMM d, HH:mm',
            )}
          </p>
          <p className="text-xs">{activity.to.title}</p>
          <p className="text-xs col-start-2 text-gray-500">
            {activity.to.description}
          </p>
        </div>
      ))}
    </div>
  )
}

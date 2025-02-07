import { feedbackEditHistoryQuery, feedbackQuery } from '@/routes/__root'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { DateTime } from 'luxon'

export const Route = createFileRoute(
  '/_public/$boardSlug/$feedbackSlug/edit-history',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { boardSlug, feedbackSlug } = useParams({
    from: '/_public/$boardSlug/$feedbackSlug/edit-history',
  })
  const { data, isLoading } = useSuspenseQuery(
    feedbackEditHistoryQuery(boardSlug, feedbackSlug),
  )
  const { data: feedback } = useSuspenseQuery(
    feedbackQuery(boardSlug, feedbackSlug),
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="vertical gap-4 grid grid-cols-[auto_1fr] border rounded-lg p-8">
      <p className="text-sm font-medium">Edit History</p>
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

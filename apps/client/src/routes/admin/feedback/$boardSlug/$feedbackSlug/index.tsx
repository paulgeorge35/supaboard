import { Avatar, DeleteFeedbackButton, EditFeedbackButton, EditHistory, NotFoundPage } from '@/components'
import { ActivityCard } from '@/components/activity-card'
import { SelectComponent } from '@/components/select'
import { Skeleton } from '@/components/skeleton'
import { feedbackActivitiesQuery, feedbackQuery } from '@/lib/query/feedback'
import { cn, SORT_OPTIONS } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useState } from 'react'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug/',
)({
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage />
})

function RouteComponent() {
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const { boardSlug, feedbackSlug } = useParams({ from: '/admin/feedback/$boardSlug/$feedbackSlug/' })
  const { data: feedback, isLoading } = useQuery(feedbackQuery(boardSlug, feedbackSlug))
  const { data: activities } = useQuery(
    feedbackActivitiesQuery(boardSlug, feedbackSlug, sort),
  )


  if (isLoading) {
    return <Skeleton className="border-4 border-zinc-300 w-full h-full rounded-2xl" />
  }

  if (!feedback) {
    throw notFound();
  }

  return (
    <span className='vertical gap-8 w-full'>
      <span className="horizontal center-v justify-start gap-4 grid col-span-full">
        <span className="horizontal justify-end">
          <Avatar
            src={feedback.author.avatar ?? undefined}
            name={feedback.author.name}
            className="size-6"
            isAdmin={feedback.author.isAdmin}
          />
        </span>
        <p
          className={cn(
            'text-sm font-medium',
            feedback.author.isAdmin && 'text-[var(--color-primary)]',
          )}
        >
          {feedback.author.name}
        </p>
        <p className="text-sm hyphens-auto font-light col-start-2">
          {feedback.description}
        </p>
        <span className="horizontal gap-2 col-start-2">
          <p className="text-xs text-gray-500 hidden md:block">
            {DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat(
              'MMMM dd, yyyy, HH:mm',
            )}
          </p>
          <p className="text-xs text-gray-500 block md:hidden">
            {DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat(
              'dd/MM/yyyy',
            )}
          </p>
          <EditFeedbackButton
            isEditable={feedback.isEditable}
            boardSlug={boardSlug}
            feedbackSlug={feedbackSlug}
            to="/admin/feedback/$boardSlug/$feedbackSlug/edit"
          />
          <DeleteFeedbackButton
            boardSlug={boardSlug}
            feedbackSlug={feedbackSlug}
          />
          <EditHistory
            boardSlug={boardSlug}
            feedbackSlug={feedbackSlug}
            edited={feedback.edited}
            to="/admin/feedback/$boardSlug/$feedbackSlug/edit-history"
          />
        </span>

      </span>
      <span className="vertical grid grid-cols-[auto_1fr] gap-8">
        {activities?.pinned && <ActivityCard activity={activities.pinned} feedbackSlug={feedbackSlug} boardSlug={boardSlug} />}

        {activities?.activities && activities.activities.length > 0 && <span className='horizontal center-v gap-4 grid col-span-full grid-cols-subgrid'>
          <span className='horizontal center-v justify-between col-start-2'>
            <p className='text-sm text-gray-500'>Activity Feed</p>
            <SelectComponent
              className='w-32 h-9'
              options={SORT_OPTIONS.map(o => ({
                label: o.label,
                value: o.value,
              }))}
              value={sort}
              onChange={(value) => setSort(value as 'newest' | 'oldest')}
            />
          </span>
        </span>}

        {activities?.activities.map(activity => (
          <ActivityCard key={activity.id} activity={activity} feedbackSlug={feedbackSlug} boardSlug={boardSlug} />
        ))}
      </span>
    </span>
  )
}

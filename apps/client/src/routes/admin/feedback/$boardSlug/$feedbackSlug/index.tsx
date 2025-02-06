import { Avatar, DeleteFeedbackButton, EditFeedbackButton, EditHistory, NotFoundPage } from '@/components'
import { Skeleton } from '@/components/skeleton'
import { cn } from '@/lib/utils'
import { feedbackQuery } from '@/routes/__root'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useParams } from '@tanstack/react-router'
import { DateTime } from 'luxon'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug/',
)({
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage />
})

function RouteComponent() {
  const { boardSlug, feedbackSlug } = useParams({ from: '/admin/feedback/$boardSlug/$feedbackSlug/' })
  const { data: feedback, isLoading } = useQuery(feedbackQuery(boardSlug, feedbackSlug))


  if (isLoading) {
    return <Skeleton className="border-4 border-zinc-300 w-full h-full rounded-2xl" />
  }

  if (!feedback) {
    throw notFound();
  }

  return (

    <span className="horizontal center-v gap-4 grid col-span-full">
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
        <p className="text-xs text-gray-500">
          {DateTime.fromJSDate(new Date(feedback.createdAt)).toFormat(
            'MMMM dd, yyyy, HH:mm',
          )}
        </p>
        <EditFeedbackButton
          isEditable={feedback.isEditable}
          boardSlug={boardSlug}
          feedbackSlug={feedbackSlug}
        />
        <DeleteFeedbackButton
          boardSlug={boardSlug}
          feedbackSlug={feedbackSlug}
        />
        <EditHistory
          boardSlug={boardSlug}
          feedbackSlug={feedbackSlug}
          edited={feedback.edited}
        />
      </span>
    </span>
  )
}

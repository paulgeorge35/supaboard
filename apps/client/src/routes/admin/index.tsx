import { Icons, StatusBoard } from '@/components'
import { applicationBoardsQuery } from '@/routes/__root'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: boards } = useSuspenseQuery(applicationBoardsQuery)

  const plannedFeedbacks = boards.flatMap((board) =>
    board.feedbacks.filter((feedback) => feedback.status === 'PLANNED'),
  )
  const inProgressFeedbacks = boards.flatMap((board) =>
    board.feedbacks.filter((feedback) => feedback.status === 'IN_PROGRESS'),
  )
  const completeFeedbacks = boards.flatMap((board) =>
    board.feedbacks.filter((feedback) => feedback.status === 'RESOLVED'),
  )
  return (
    <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8 px-4 md:px-0">
    <span className="horizontal center-v justify-between">
      <h1 className="font-medium">Roadmap</h1>
      <button
        type="button"
        className="button button-small button-secondary"
      >
        <Icons.Filter size={14} />
        Filters
      </button>
    </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatusBoard status="PLANNED" items={plannedFeedbacks} />
        <StatusBoard status="IN_PROGRESS" items={inProgressFeedbacks} />
        <StatusBoard status="RESOLVED" items={completeFeedbacks} />
      </div>
    </div>
  )
}

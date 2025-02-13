import { Board as BoardComponent, Icons, StatusBoard } from '@/components'
import { applicationBoardsQuery } from '@/lib/query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
  component: HomeComponent,
})

function HomeComponent() {
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
    <>
      <span className="horizontal center-v justify-between">
        <h1 className="font-medium">Boards</h1>
      </span>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {boards.filter((board) => board.showOnHome).map((board) => (
          <BoardComponent
            key={board.slug}
            title={board.name}
            items={board.count}
            to={board.slug}
          />
        ))}
      </div>

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
    </>
  )
}

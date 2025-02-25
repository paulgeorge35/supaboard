import { Board as BoardComponent, Icons, NotFoundPage, StatusBoard } from '@/components'
import { Invitation } from '@/components/public/invitations'
import { applicationBoardsQuery, statusesQuery } from '@/lib/query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/')({
  notFoundComponent: () => <NotFoundPage />,
  component: HomeComponent,
})

function HomeComponent() {
  const { data: boards } = useSuspenseQuery(applicationBoardsQuery)
  const { data: statuses } = useSuspenseQuery(statusesQuery)

  const hasPublicBoards = boards.some((board) => board.showOnHome)

  return (
    <>
      {hasPublicBoards && (
        <>
          <Invitation />
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
        </>
      )}

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
        {statuses?.filter(status => status.includeInRoadmap).map(status => (
          <StatusBoard key={status.slug} status={status} items={boards.flatMap(board => board.feedbacks.filter(feedback => feedback.status.slug === status.slug))} />
        ))}
      </div>
    </>
  )
}

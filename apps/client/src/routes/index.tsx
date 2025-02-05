import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Board as BoardComponent } from '../components/board'
import { Icons } from '../components/icons'
import { StatusBoard } from '../components/status-board'
import { applicationBoardsQuery } from './__root'
export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { data: boards } = useSuspenseQuery(applicationBoardsQuery)

  const plannedFeedbacks = boards.flatMap(board => board.feedbacks.filter(feedback => feedback.status === 'PLANNED'))
  const inProgressFeedbacks = boards.flatMap(board => board.feedbacks.filter(feedback => feedback.status === 'IN_PROGRESS'))
  const completeFeedbacks = boards.flatMap(board => board.feedbacks.filter(feedback => feedback.status === 'RESOLVED'))

  return (
    <>
      <span className='horizontal center-v justify-between'>
        <h1 className='font-medium'>Boards</h1>
      </span>
      <div className='grid grid-cols-3 gap-8'>
        {boards.map((board) => (
          <BoardComponent key={board.slug} title={board.name} items={board.count} to={board.slug} />
        ))}
      </div>

      <span className='horizontal center-v justify-between'>
        <h1 className='font-medium'>Roadmap</h1>
        <button type='button' className='dark:bg-gray-700 rounded-md border font-light px-2 py-1 text-sm horizontal center-v gap-2 text-gray-500 hover:text-gray-700 [&>svg]:stroke-gray-500 hover:[&>svg]:stroke-gray-700'>
          <Icons.Filter size={14} />
          Filters
        </button>
      </span>

      <div className='grid grid-cols-3 gap-8'>
        <StatusBoard
          status='PLANNED'
          items={plannedFeedbacks}
        />
        <StatusBoard
          status='IN_PROGRESS'
          items={inProgressFeedbacks}
        />
        <StatusBoard
          status='RESOLVED'
          items={completeFeedbacks}
        />
      </div>
    </>
  )
}

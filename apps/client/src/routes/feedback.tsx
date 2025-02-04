import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/feedback')({
  component: FeedbackComponent,
})

function FeedbackComponent() {
  return (
    <div className='grid grid-cols-[300px_1fr] gap-8'>
      <div className='vertical gap-2'>
      <h1 className='font-medium'>Boards</h1>
      </div>
      <div className='vertical gap-2'>
        <h1>Give Feedback</h1>
      </div>
    </div>
  )
}

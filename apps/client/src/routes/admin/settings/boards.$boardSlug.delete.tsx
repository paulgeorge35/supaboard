import { Button, Input } from '@/components'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/delete',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const handleDelete = () => {
    console.log('delete')
  }

  return (
    <div className='vertical gap-4 items-start'>
      <span className='px-4 py-1 rounded-md bg-orange-500/20 text-orange-500'>Attention</span>
      <p className='text-sm font-medium'>
        Deleting this board will remove it from your application. This action is irreversible.
      </p>
      <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
        This will delete all the data associated with this board, including all the feedbacks, categories, tags, and comments.
      </p>

      <Input
        label='Type the board name to confirm deletion'
        name='confirm'
        className='w-full'
      />

      <Button type='button' color='primary' onClick={handleDelete}>Delete Board</Button>
    </div>
  )
}

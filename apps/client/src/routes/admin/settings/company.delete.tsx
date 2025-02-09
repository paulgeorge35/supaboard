import { Button, Checkbox, Input } from '@/components'
import { fetchClient } from '@/lib/client'
import { Application } from '@repo/database'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/admin/settings/company/delete')({
  component: RouteComponent,
})

type ApplicationStats = Application & {
  feedbacks: number
  votes: number
  comments: number
  users: number
}

const applicationQuery = queryOptions<ApplicationStats>({
  queryKey: ['application'],
  queryFn: () => fetchClient('application'),
})

function RouteComponent() {
  const { data } = useQuery(applicationQuery);
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const handleDelete = () => {
    console.log('delete')
  }

  const isValidated = useMemo(() => {
    return confirm && confirmText === data?.name;
  }, [confirm, confirmText, data?.name]);

  return (
    <div className='vertical gap-4 items-start'>
      <span className='px-4 py-1 rounded-md bg-orange-500/20 text-orange-500'>Attention</span>
      <h1 className='font-medium'>Workspace Deletion</h1>
      <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
        You are about to delete your SupaBoard Workspace <strong>{data?.name}</strong>. This will permanently delete all your data, including:
      </p>

      <ul className='list-disc list-inside [&>li]:text-sm [&>li]:font-light [&>li]:text-gray-500 dark:[&>li]:text-zinc-400'>
        <li>{data?.feedbacks ?? '-'} {data?.feedbacks === 1 ? 'feedback' : 'feedbacks'}</li>
        <li>{data?.votes ?? '-'} {data?.votes === 1 ? 'vote' : 'votes'}</li>
        <li>{data?.comments ?? '-'} {data?.comments === 1 ? 'comment' : 'comments'}</li>
        <li>{data?.users ?? '-'} {data?.users === 1 ? 'user' : 'users'}</li>
      </ul>

      <Input
        label='Type the workspace name to confirm deletion'
        name='confirm'
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className='w-full'
      />
      <Checkbox
        label='I acknowledge that this action is irreversible and all data will be lost'
        name='confirm'
        className='w-full'
        checked={confirm}
        onChange={(e) => setConfirm(e.target.checked)}
      />

      <Button type='button' color='danger' onClick={handleDelete} disabled={!isValidated}>Delete Workspace</Button>
      
    </div>
  )
}

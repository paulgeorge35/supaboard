import { Button, Checkbox, Input } from '@/components';
import { fetchClient } from '@/lib/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { boardQuery } from './boards.$boardSlug.general';

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/delete',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { boardSlug } = useParams({ from: Route.fullPath });
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const { data } = useQuery(boardQuery(boardSlug));

  const { mutate: deleteBoard, isPending } = useMutation({
    mutationFn: () => fetchClient(`board/${boardSlug}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      toast.success('Board deleted successfully');
      router.navigate({ to: '/admin/settings' });
    }
  })

  const handleDelete = () => {
    deleteBoard()
  }
  const isValidated = useMemo(() => {
    return confirm && confirmText === data?.name;
  }, [confirm, confirmText, data?.name]);

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
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
      <Checkbox
        label='I acknowledge that this action is irreversible and all data will be lost'
        name='confirm'
        className='w-full'
        checked={confirm}
        onChange={(e) => setConfirm(e.target.checked)}
      />

      <Button type='button' color='danger' onClick={handleDelete} disabled={!isValidated || isPending}>Delete Board</Button>
    </div>
  )
}

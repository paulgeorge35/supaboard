import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { useCreateLabelMutation, useDeleteLabelMutation, useUpdateLabelMutation } from '@/lib/mutation/changelog';
import { changelogLabelsQuery } from '@/lib/query/changelog';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/admin/settings/changelog/labels')({
  component: RouteComponent,
})

function RouteComponent() {
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const { data: labels } = useQuery(changelogLabelsQuery);
  const { mutate: createLabel, isPending: isCreatingLabel } = useCreateLabelMutation(() => setName(''));
  const { mutate: updateLabel, isPending: isUpdatingLabel } = useUpdateLabelMutation(() => setEditId(null));
  const { mutate: deleteLabel, isPending: isDeletingLabel } = useDeleteLabelMutation(() => setEditId(null));

  const isLoading = isCreatingLabel || isUpdatingLabel || isDeletingLabel;

  return (
    <div className='vertical gap-2'>
      <p className='text-sm font-light'>
        Labels look like this: <Badge label='Label name' className='ml-2' />
      </p>
      <p className='text-sm font-light'>
        You can add labels to changelog entries to specify which part of your product is being changed.
        Labels are public-facing, and can be used to filter down the list view.
      </p>
      <div className='vertical'>
        {labels?.map((label) => (
          <div key={label.id} className='group horizontal gap-2 center-v border-b py-2'>
            <Input
              value={editId === label.id ? name : `${label.name} (${label.count} entries)`}
              readOnly={editId !== label.id}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                'grow',
                {
                  'border-none': editId !== label.id
                }
              )}
            />
            <Button
              onClick={() => {
                setEditId(editId === label.id ? null : label.id);
                setName(editId === label.id ? '' : label.name);
              }}
              variant='ghost'
              color='secondary'
              size='sm'
              className={cn(
                'ml-auto hidden group-hover:flex',
                {
                  'flex': editId === label.id
                }
              )}
              disabled={isLoading}
            >
              {editId === label.id ? 'Cancel' : 'Rename'}
            </Button>
            {editId === null &&
              <Button
                onClick={() => deleteLabel(label.id)}
                variant='ghost'
                color='secondary'
                size='sm'
                disabled={isLoading}
                className='hidden group-hover:flex'
              >
                Delete
              </Button>
            }
            {editId === label.id &&
              <Button
                onClick={() => updateLabel({ id: label.id, name })}
                variant='ghost'
                color='secondary'
                size='sm'
                isLoading={isLoading}
              >
                Save
              </Button>
            }
          </div>
        ))}
        {editId === null &&
          <div className='horizontal gap-2 center-v'>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Add a label'
              className='w-full border-none'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() !== '') {
                  createLabel(name);
                }
              }}
            />
            <Button
              onClick={() => createLabel(name)}
              variant='ghost'
              color='secondary'
              size='sm'
              disabled={isLoading}
            >
              Create
            </Button>
          </div>
        }
      </div>
    </div>
  )
}

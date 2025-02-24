import { Button, Icons, Input } from '@/components';
import { fetchClient } from '@/lib/client';
import { cn } from '@/lib/utils';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export type TagSummary = {
  id: string;
  name: string;
  count: number;
  board: {
    slug: string;
  }
}

export const tagsQuery = (boardSlug: string, search?: string, all?: boolean) => queryOptions<TagSummary[]>({
  queryKey: ['board', boardSlug, 'tags', search, all],
  queryFn: () => fetchClient(`board/${boardSlug}/tags`,
    { queryParams: { search, all } }),
  enabled: !!boardSlug
})

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/tags',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { boardSlug } = useParams({ from: '/admin/settings/boards/$boardSlug/tags' })

  const { data: tags } = useQuery(tagsQuery(boardSlug))

  const { mutate: createTag, isPending: isCreatingTag } = useMutation({
    mutationFn: () => fetchClient(`board/${boardSlug}/tags`, {
      method: 'POST',
      body: JSON.stringify({ name, throwError: true })
    }),
    onMutate: () => {
      queryClient.cancelQueries(tagsQuery(boardSlug))

      const previousTags = queryClient.getQueryData<TagSummary[]>(tagsQuery(boardSlug).queryKey)

      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, (old: TagSummary[] | undefined) => {
        if (!old) return undefined;
        return [...old, { id: 'new', name, count: 0, board: { slug: boardSlug } }]
      })

      return { previousTags }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, context?.previousTags)
    },
    onSettled: () => {
      queryClient.invalidateQueries(tagsQuery(boardSlug))
      setName('')
    }
  })

  const { mutate: updateTag, isPending: isUpdatingTag } = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string, name: string }) => fetchClient(`board/${boardSlug}/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    }),
    onMutate: () => {
      queryClient.cancelQueries(tagsQuery(boardSlug))

      const previousTags = queryClient.getQueryData<TagSummary[]>(tagsQuery(boardSlug).queryKey)

      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, (old: TagSummary[] | undefined) => {
        if (!old) return undefined;
        return old.map(tag => tag.id === editId ? { ...tag, name } : tag) ?? []
      })

      return { previousTags }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, context?.previousTags)
    },
    onSettled: () => {
      queryClient.invalidateQueries(tagsQuery(boardSlug))
      setEditId(null)
      setName('')
    }
  })

  const { mutate: deleteTag } = useMutation({
    mutationFn: ({ tagId }: { tagId: string }) => fetchClient(`board/${boardSlug}/tags/${tagId}`, {
      method: 'DELETE'
    }),
    onMutate: () => {
      queryClient.cancelQueries(tagsQuery(boardSlug))

      const previousTags = queryClient.getQueryData<TagSummary[]>(tagsQuery(boardSlug).queryKey)

      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, (old: TagSummary[] | undefined) => {
        if (!old) return undefined;
        return old.filter(tag => tag.id !== editId) ?? []
      })

      return { previousTags }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(tagsQuery(boardSlug).queryKey, context?.previousTags)
    },
    onSettled: () => {
      queryClient.invalidateQueries(tagsQuery(boardSlug))
    },
    onSuccess: () => {
      toast.success('Tag successfully deleted')
    }
  })

  const handleCreateTag = () => {
    createTag()
  }

  const handleUpdateTag = () => {
    if (editId === null) return;
    updateTag({ tagId: editId, name })
  }

  const handleDeleteTag = (tagId: string) => {
    deleteTag({ tagId })
  }

  return (
    <div className='vertical gap-2'>
      <p className='text-sm font-light'>
        Tags are a way to categorize feedback. They are only visible to members of your workspace.
      </p>
      <div className='vertical'>
        <br />
        {tags?.map((tag, index) => (
          <span key={tag.id} className={cn('horizontal gap-2 space-between center-v border-b text-sm pl-4 font-light py-2 group h-14', {
            'border-t': index === 0
          })}>
            <Input
              className='p-0 border-0 grow'
              readOnly={editId !== tag.id}
              value={editId === tag.id ? name : `${tag.name} (${tag.count})`}
              onChange={(e) => setName(e.target.value.slice(0, 10))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.length >= 3) {
                  handleUpdateTag()
                }
              }}
            />
            <div className='horizontal center-v gap-2'>
              <Button
                color='secondary'
                size='sm'
                className={cn({
                  'hidden': editId !== tag.id
                })}
                onClick={() => {
                  handleUpdateTag()
                }}
                disabled={isUpdatingTag || name.length < 3}
              >
                Save
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  if (editId === tag.id) {
                    setEditId(null)
                    setName('')
                  } else {
                    setEditId(tag.id)
                    setName(tag.name)
                  }
                }}
                className={cn('opacity-0 group-hover:opacity-100 transition-opacity duration-200', {
                  'opacity-100': editId === tag.id,
                  'hidden': editId !== null && editId !== tag.id
                })}
              >
                {editId === tag.id ? <Icons.X /> : <Icons.Pencil />}
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  handleDeleteTag(tag.id)
                }}
                className={cn('opacity-0 group-hover:opacity-100 transition-opacity duration-200', {
                  'opacity-100': editId === tag.id,
                  'hidden': editId !== null && editId !== tag.id
                })}
              >
                <Icons.Trash2 />
              </Button>
            </div>
          </span>
        ))}
        <Input
          placeholder='Create new tag...'
          className={cn('p-0 border-0 pl-4 h-14 py-1', {
            'hidden': editId !== null
          })}
          value={editId === null ? name : ''}
          onChange={(e) => setName(e.target.value.slice(0, 10))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.length >= 3) {
              handleCreateTag()
            }
          }}
          addornmentRight={
            <div className='vertical center-v items-end gap-2 h-full'>
              <Button
                size='sm'
                color='secondary'
                variant='ghost'
                className={cn({
                  '!opacity-0': name.length < 3
                })}
                disabled={name.length < 3 || isCreatingTag}
                onClick={() => handleCreateTag()}
              >
                Create
              </Button>
            </div>
          }
          description='Must not exceed 10 characters'
        />
      </div>
    </div>
  )
}

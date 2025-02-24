import { Checkbox, Icons } from '@/components';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Switch } from '@/components/switch';
import { fetchClient } from '@/lib/client';
import { cn } from '@/lib/utils';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  count: number;
  board: {
    slug: string;
  }
  subscribed: boolean;
}

export const categoriesQuery = (boardSlug: string, search?: string, all = false) => queryOptions<CategorySummary[]>({
  queryKey: ['board', boardSlug, 'categories', search, all],
  queryFn: () => fetchClient(`/board/${boardSlug}/categories`, {
    queryParams: { search, all }
  }),
  enabled: !!boardSlug,
  retry: false,
})

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/categories',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const [newCategory, setNewCategory] = useState('')
  const [editSlug, setEditSlug] = useState<string | null>(null)
  const [subscribeAllAdmins, setSubscribeAllAdmins] = useState(true)
  const queryClient = useQueryClient()
  const { boardSlug } = useParams({ from: '/admin/settings/boards/$boardSlug/categories' })
  const { data: categories } = useQuery(categoriesQuery(boardSlug))

  const { mutate: updateSubscribed, isPending: isUpdatingSubscribed } = useMutation({
    mutationFn: ({ categorySlug, subscribed }: { categorySlug: string, subscribed: boolean }) => fetchClient(`/board/${boardSlug}/categories/${categorySlug}/subscription`, {
      method: 'POST',
      queryParams: { subscribed }
    }),
    onMutate: async ({ categorySlug, subscribed }) => {
      await queryClient.cancelQueries(categoriesQuery(boardSlug))
      const previousCategories = queryClient.getQueryData<CategorySummary[]>(categoriesQuery(boardSlug).queryKey)

      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, (old: CategorySummary[] | undefined) => {
        if (!old) return undefined;
        return old.map(category => category.slug === categorySlug ? { ...category, subscribed } : category) ?? []
      })

      return { previousCategories }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries(categoriesQuery(boardSlug))
    }
  })

  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation({
    mutationFn: () => fetchClient(`/board/${boardSlug}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name: newCategory, subscribeAllAdmins })
    }),
    onMutate: () => {
      queryClient.cancelQueries(categoriesQuery(boardSlug))

      const previousCategories = queryClient.getQueryData<CategorySummary[]>(categoriesQuery(boardSlug).queryKey)

      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, (old: CategorySummary[] | undefined) => {
        if (!old) return undefined;
        return [...old, { id: 'new', name: newCategory, slug: newCategory, count: 0, subscribed: subscribeAllAdmins, board: { slug: boardSlug } }]
      })

      return { previousCategories }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries(categoriesQuery(boardSlug));
      setNewCategory('')
    }
  })

  const { mutate: updateCategory, isPending: isUpdatingCategory } = useMutation({
    mutationFn: ({ categorySlug, name }: { categorySlug: string, name: string }) => fetchClient(`/board/${boardSlug}/categories/${categorySlug}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    }),
    onMutate: () => {
      queryClient.cancelQueries(categoriesQuery(boardSlug));

      const previousCategories = queryClient.getQueryData<CategorySummary[]>(categoriesQuery(boardSlug).queryKey)

      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, (old: CategorySummary[] | undefined) => {
        if (!old) return undefined;
        return old.map(category => category.slug === editSlug ? { ...category, name: newCategory } : category) ?? []
      })

      return { previousCategories }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries(categoriesQuery(boardSlug));
      setEditSlug(null)
      setNewCategory('')
    }
  })

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: ({ categorySlug }: { categorySlug: string }) => fetchClient(`/board/${boardSlug}/categories/${categorySlug}`, {
      method: 'DELETE'
    }),
    onMutate: () => {
      queryClient.cancelQueries(categoriesQuery(boardSlug));
      const previousCategories = queryClient.getQueryData<CategorySummary[]>(categoriesQuery(boardSlug).queryKey)

      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, (old: CategorySummary[] | undefined) => {
        if (!old) return undefined;
        return old.filter(category => category.slug !== editSlug) ?? []
      })

      return { previousCategories }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(categoriesQuery(boardSlug).queryKey, context?.previousCategories)
    },
    onSettled: () => {
      queryClient.invalidateQueries(categoriesQuery(boardSlug))
    },
    onSuccess: () => {
      toast.success('Category successfully deleted')
    }
  })

  const handleUpdateSubscribed = (categorySlug: string, subscribed: boolean) => {
    updateSubscribed({ categorySlug, subscribed })
  }

  const handleCreateCategory = () => {
    createCategory()
  }

  const handleUpdateCategory = () => {
    if (editSlug === null) return;
    updateCategory({ categorySlug: editSlug, name: newCategory })
  }

  const handleDeleteCategory = (categorySlug: string) => {
    deleteCategory({ categorySlug })
  }

  return (
    <div className='vertical gap-2'>
      <p className='text-sm font-light'>
        Categories are an additional level of organization within boards. Typically you'll want to make one category per team. This way people can subscribe to just the feedback that's relevant to them.
      </p>
      <div className='vertical'>
        <p className='text-xs font-medium ml-auto uppercase mb-2'>Subscribed</p>
        {categories?.map((category, index) => (
          <span key={category.id} className={cn('horizontal gap-2 space-between center-v border-t pl-8 text-sm font-light py-2 group h-14', {
            'border-b': index === categories.length - 1
          })}>
            <Input
              className='p-0 border-0 grow'
              readOnly={editSlug !== category.slug}
              value={editSlug === category.slug ? newCategory : `${category.name} (${category.count})`}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategory.length >= 3) {
                  handleUpdateCategory()
                }
              }}
            />
            <div className='horizontal center-v gap-2'>
              <Button
                color='secondary'
                size='sm'
                className={cn({
                  'hidden': category.slug === 'uncategorized' || editSlug !== category.slug
                })}
                onClick={() => {
                  handleUpdateCategory()
                }}
                disabled={isUpdatingCategory || newCategory.length < 3}
              >
                Save
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  if (editSlug === category.slug) {
                    setEditSlug(null)
                    setNewCategory('')
                  } else {
                    setEditSlug(category.slug)
                    setNewCategory(category.name)
                  }
                }}
                className={cn('opacity-0 group-hover:opacity-100 transition-opacity duration-200', {
                  'opacity-100': editSlug === category.slug,
                  'hidden': category.slug === 'uncategorized' || (editSlug && editSlug !== category.slug)
                })}
              >
                {editSlug === category.slug ? <Icons.X /> : <Icons.Pencil />}
              </Button>
              <Button
                variant='ghost'
                color='danger'
                size='icon'
                onClick={() => handleDeleteCategory(category.slug)}
                className={cn('opacity-0 group-hover:opacity-100 transition-opacity duration-200', {
                  'hidden': category.slug === 'uncategorized' || editSlug
                })}
              >
                <Icons.Trash2 />
              </Button>
              <Switch disabled={isUpdatingSubscribed} checked={category.subscribed} onChange={() => handleUpdateSubscribed(category.slug, !category.subscribed)} />
            </div>
          </span>
        ))}
        <Input
          placeholder='Create new category...'
          className={cn('p-0 border-0 pl-4 h-14', {
            'hidden': editSlug !== null
          })}
          inputClassName='pl-4 py-2'
          value={editSlug === null ? newCategory : ''}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCategory.length >= 3) {
              handleCreateCategory()
            }
          }}
          addornmentRight={
            <div className='vertical center-v items-end gap-2 h-full'>
              <Button
                size='sm'
                color='secondary'
                variant='ghost'
                className={cn({
                  '!opacity-0': newCategory.length < 3
                })}
                disabled={newCategory.length < 3 || isCreatingCategory}
                onClick={() => handleCreateCategory()}
              >
                Create
              </Button>
            </div>
          }
        />
        {newCategory.length >= 3 && (
          <Checkbox
            label='Subscribe all admins'
            checked={subscribeAllAdmins}
            onChange={() => setSubscribeAllAdmins(!subscribeAllAdmins)}
            wrapperClassName='ml-auto'
          />
        )}
      </div>
    </div>
  )
}

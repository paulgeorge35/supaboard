import { Button } from '@/components/button'
import { Switch } from '@/components/switch'
import { fetchClient } from '@/lib/client'
import { BoardQueryData } from '@/routes/__root'
import { useAuthStore } from '@/stores/auth-store'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { boardQuery } from './boards.$boardSlug.general'

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/privacy',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { application } = useAuthStore()
  const queryClient = useQueryClient()
  const { boardSlug } = useParams({ from: '/admin/settings/boards/$boardSlug/privacy' })

  const { data: board } = useQuery(boardQuery(boardSlug))

  const url = useMemo(() => {
    if (application?.customDomain && application?.domainStatus === 'VERIFIED') {
      return `${application?.customDomain}`
    }
    return `${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}`
  }, [application, boardSlug])

  const schema = z.object({
    showOnHome: z.boolean(),
    public: z.boolean(),
  })

  const { mutate: updateBoard, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient(`board/${boardSlug}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardSlug] })

      const previousBoard = queryClient.getQueryData<BoardQueryData>(['board', boardSlug])

      queryClient.setQueryData(['board', boardSlug], (old: BoardQueryData | undefined) => {
        if (!old) return undefined;

        return {
          ...old,
          showOnHome: data.showOnHome,
          public: data.public,
        }
      })

      return { previousBoard }
    },
    onSuccess: () => {
      toast.success('Board privacy updated successfully')
      form.reset();
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['board', boardSlug], context?.previousBoard)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardSlug] })
    }
  })

  const form = useForm({
    defaultValues: {
      showOnHome: board?.showOnHome ?? false,
      public: board?.public ?? false,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async (data) => {
      updateBoard(data.value)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className='vertical gap-2 items-start'>
      <div className='w-full grid grid-cols-[1fr_auto] gap-8'>
        <span className='vertical gap-2'>
          <p className='text-sm font-medium'>Board access</p>
          <p className='text-sm font-light text-gray-500 dark:text-zinc-400 text-balance'>
            Control who can access your board. Public boards are open to anyone, while private boards can only be seen internally
          </p>
        </span>
        <span className='vertical gap-2 center-v'>
          <form.Field
            name='public'
            children={(field) => (
              <Switch
                label='Public'
                labelPosition='left'
                name={field.name}
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
            )}
          />
        </span>
      </div>
      <hr className='my-2 w-full' />
      <p className='text-sm font-medium'>Public access</p>
      <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
        Any user can access this board.
      </p>
      <form.Field
        name='showOnHome'
        children={(field) => (
          <span className='horizontal space-between center-v w-full'>
            <p className='text-sm font-light'>
              {`Show this board on the home page (${url})`}
            </p>
            <Switch
              name={field.name}
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
          </span>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
        children={([canSubmit, isSubmitting, isDirty]) => (
          <Button type='submit' color='primary' isLoading={isSubmitting || isPending} disabled={!canSubmit || !isDirty}>
            Save
          </Button>
        )}
      />
    </form>
  )
}

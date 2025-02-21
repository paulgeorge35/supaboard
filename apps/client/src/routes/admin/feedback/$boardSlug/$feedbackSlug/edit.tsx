import { FieldInfo } from '@/components'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { fetchClient } from '@/lib/client'
import { feedbackQuery } from '@/lib/query/feedback'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useParams, useRouter, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const search = useSearch({ from: '/admin/feedback/$boardSlug/$feedbackSlug/edit' })
  const queryClient = useQueryClient()
  const router = useRouter()
  const { boardSlug, feedbackSlug } = useParams({
    from: '/admin/feedback/$boardSlug/$feedbackSlug/edit',
  })

  const { data: feedback } = useSuspenseQuery(
    feedbackQuery(boardSlug, feedbackSlug),
  )

  const schema = z.object({
    title: z.string({
      required_error: 'Title is required',
    }).max(100, 'Title must be less than 100 characters'),
    description: z.string({
      required_error: 'Description is required',
    }).max(1000, 'Description must be less than 1000 characters'),
  })

  const { mutate: updateFeedback, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) =>
      fetchClient(`feedback/${boardSlug}/${feedbackSlug}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success('Feedback updated')
      queryClient.invalidateQueries({
        queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey,
      })
      router.navigate({
        to: '/admin/feedback/$boardSlug/$feedbackSlug',
        params: { boardSlug, feedbackSlug },
        replace: true,
        search,
      })
    },
    onError: () => {
      toast.error('Failed to update feedback')
    },
  })

  const form = useForm({
    defaultValues: {
      title: feedback.title ?? '',
      description: feedback.description ?? '',
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async (data) => {
      updateFeedback(data.value)
    },
  })

  const handleCancel = () => {
    router.navigate({
      to: '/admin/feedback/$boardSlug/$feedbackSlug',
      params: { boardSlug, feedbackSlug },
      replace: true,
      search,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <div className="vertical gap-4 w-full h-full">
      <h1 className="font-light">Edit Feedback</h1>
      <form
        className="w-full vertical gap-4 items-start grow"
        onSubmit={handleSubmit}
      >
        <form.Field
          name="title"
          children={(field) => (
            <>
              <Input
                label="Title"
                required
                className="w-full"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <>
              <span className="w-full vertical gap-2 items-start h-full">
                <p className="text-xs text-gray-500 uppercase font-bold">
                  Description
                </p>
                <textarea
                  name={field.name}
                  className="font-light w-full grow focus:outline-none px-3 py-2 rounded-md border resize-none md:text-sm text-zinc-800 dark:text-zinc-300"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      e.preventDefault()
                      form.handleSubmit()
                    }
                  }}
                />
              </span>
              <FieldInfo field={field} />
            </>
          )}
        />

        <span className="horizontal gap-2 justify-end w-full">
          <Button
            type="button"
            color="secondary"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.isDirty,
            ]}
            children={([canSubmit, isSubmitting, isDirty]) => (
              <Button
                type="submit"
                color="primary"
                isLoading={isSubmitting || isPending}
                disabled={!canSubmit || !isDirty}
              >
                Save
              </Button>
            )}
          />
        </span>
      </form>
    </div>
  )
}

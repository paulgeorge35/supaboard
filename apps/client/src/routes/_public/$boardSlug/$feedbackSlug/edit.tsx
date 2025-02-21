import { FieldInfo, Input } from '@/components'
import { fetchClient } from '@/lib/client'
import { feedbackQuery } from '@/lib/query/feedback'
import { useForm } from '@tanstack/react-form'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/_public/$boardSlug/$feedbackSlug/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { boardSlug, feedbackSlug } = useParams({
    from: '/_public/$boardSlug/$feedbackSlug/edit',
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
        to: '/$boardSlug/$feedbackSlug',
        params: { boardSlug, feedbackSlug },
        replace: true,
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
      to: '/$boardSlug/$feedbackSlug',
      params: { boardSlug, feedbackSlug },
      replace: true,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <div className="border rounded-lg px-8 py-4 vertical gap-4 items-start">
      <h1 className="">Edit Feedback</h1>
      <form
        className="w-full vertical gap-4 items-start"
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
              <span className="w-full vertical gap-2 items-start">
                <p className="text-xs text-gray-600 dark:text-zinc-500 uppercase font-medium">
                  Description
                </p>
                <textarea
                  placeholder="Description"
                  className="font-light w-full focus:outline-none px-2 py-2 md:text-sm rounded-md border resize-none"
                  name={field.name}
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
          <button
            type="button"
            className="button button-secondary"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.isDirty,
            ]}
            children={([canSubmit, isSubmitting, isDirty]) => (
              <button
                type="submit"
                className="button button-primary"
                disabled={!canSubmit || !isDirty || isSubmitting || isPending}
              >
                Save
              </button>
            )}
          />
        </span>
      </form>
    </div>
  )
}

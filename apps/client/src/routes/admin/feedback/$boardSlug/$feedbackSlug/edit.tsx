import { fetchClient } from '@/lib/client'
import { feedbackQuery } from '@/lib/query/feedback'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { boardSlug, feedbackSlug } = useParams({
    from: '/admin/feedback/$boardSlug/$feedbackSlug/edit',
  })

  const { data: feedback } = useSuspenseQuery(
    feedbackQuery(boardSlug, feedbackSlug),
  )
  const [form, setForm] = useState({
    title: feedback.title ?? '',
    description: feedback.description ?? '',
  })

  const { mutate: updateFeedback, isPending } = useMutation({
    mutationFn: () =>
      fetchClient(`feedback/${boardSlug}/${feedbackSlug}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success('Feedback updated')
    },
    onError: () => {
      toast.error('Failed to update feedback')
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey,
      })
      router.navigate({
        to: '/admin/feedback/$boardSlug/$feedbackSlug',
        params: { boardSlug, feedbackSlug },
        replace: true,
      })
    },
  })

  const handleCancel = () => {
    router.navigate({
      to: '/admin/feedback/$boardSlug/$feedbackSlug',
      params: { boardSlug, feedbackSlug },
      replace: true,
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateFeedback()
  }

  const isSubmitDisabled =
    isPending ||
    (form.title.trim() === feedback.title &&
      form.description.trim() === feedback.description)
  return (

    <div className="vertical gap-4 w-full">
      <h1 className="font-light">Edit Feedback</h1>
      <form
        className="w-full vertical gap-4 items-start"
        onSubmit={handleSubmit}
      >
        <span className="w-full vertical gap-2 items-start">
          <p className="text-xs text-gray-500 uppercase font-bold">Title</p>
          <input
            type="text"
            placeholder="Title"
            className="font-light w-full focus:outline-none px-2 py-1 rounded-md border"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </span>

        <span className="w-full vertical gap-2 items-start">
          <p className="text-xs text-gray-500 uppercase font-bold">
            Description
          </p>
          <textarea
            placeholder="Description"
            className="font-light w-full focus:outline-none px-2 py-1 rounded-md border"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </span>

        <span className="horizontal gap-2 justify-end w-full">
          {/* <button type="button" className='mr-auto'>Attach</button> */}
          <button
            type="button"
            className="button button-secondary"
            disabled={isPending}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={isSubmitDisabled}
          >
            Save
          </button>
        </span>
      </form>
    </div>
  )
}

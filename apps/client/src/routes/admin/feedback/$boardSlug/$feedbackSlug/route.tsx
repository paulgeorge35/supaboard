import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/feedback/$boardSlug/$feedbackSlug',
)({
  component: RouteComponent,
})

function RouteComponent() {
  console.log('/admin/feedback/$boardSlug/$feedbackSlug/')
  return (
    <div className="border-4 border-zinc-300 w-full h-full rounded-2xl">
        Feedback ID
    </div>
  )
}

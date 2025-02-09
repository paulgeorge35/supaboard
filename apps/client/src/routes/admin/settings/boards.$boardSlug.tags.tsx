import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/settings/boards/$boardSlug/tags',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='vertical gap-2'>
      Tags
    </div>
  )
}

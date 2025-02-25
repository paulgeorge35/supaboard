import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/roadmap/archive')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/settings/roadmap/archive"!</div>
}

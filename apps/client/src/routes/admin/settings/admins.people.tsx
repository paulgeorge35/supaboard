import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/admins/people')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/settings/admins/people"!</div>
}

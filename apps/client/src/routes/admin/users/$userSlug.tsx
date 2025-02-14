import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/users/$userSlug')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/users/"!</div>
}

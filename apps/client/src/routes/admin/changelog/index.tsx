import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/changelog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/changelog/"!</div>
}

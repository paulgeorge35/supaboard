import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/roadmap/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/roadmap/"!</div>
}

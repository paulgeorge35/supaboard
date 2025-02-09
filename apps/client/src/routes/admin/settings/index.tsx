import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Navigate to='/admin/settings/profile' replace />
}

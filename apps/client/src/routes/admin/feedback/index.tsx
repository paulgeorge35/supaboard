import { useAuthStore } from '@/stores/auth-store'
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/feedback/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { application } = useAuthStore()
  const url = `/admin/feedback/${application?.boards[0].slug}/`

  console.log('/admin/feedback/')

  return <Navigate to={url} />
}

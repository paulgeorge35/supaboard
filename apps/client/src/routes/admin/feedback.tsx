import { Boards, Categories, Owner, Status, Tags } from '@/components/admin'
import { useAuthStore } from '@/stores/auth-store'
import { createFileRoute, Navigate, Outlet, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/feedback')({
  component: RouteComponent,
})

function RouteComponent() {
  const { application } = useAuthStore()
  const { boardSlug } = useParams({ strict: false })
  const url = `/admin/feedback/${application?.boards[0].slug}/`

  return (
    <div className="grid grid-cols-[minmax(200px,320px)_minmax(300px,360px)_minmax(60%,1fr)] h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">
          <Boards />
          <Status />
          <Tags />
          <Categories />
          <Owner />
        </div>
      </div>
      <Outlet />
      {application?.boards[0].slug && !boardSlug && <Navigate to={url} />}
    </div>
  )
}

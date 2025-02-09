import { ActivityOverview } from '@/components/admin/home/activity-overview'
import { Boards } from '@/components/admin/home/boards'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

function RouteComponent() {

  return (
    <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8 px-4 md:px-0 pt-22">
      <ActivityOverview />
      <Boards />
    </div>
  )
}

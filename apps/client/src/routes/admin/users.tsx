import { createFileRoute, Outlet, useSearch } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const userSearchSchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  take: z.number().optional(),
  order: z.enum(['last-activity', 'top-posters', 'top-voters']).optional(),
  filter: z.array(z.enum(['posts', 'votes', 'comments'])).optional(),
  start: z.string().optional(),
  end: z.string().optional()
})

export const Route = createFileRoute('/admin/users')({
  validateSearch: zodValidator(userSearchSchema),
  component: RouteComponent,
})

function RouteComponent() {
  const search = useSearch({ from: Route.fullPath })
  
  return (
    <div className="grid grid-cols-[minmax(200px,250px)_minmax(300px,360px)_minmax(60%,1fr)] w-full h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">

        </div>
      </div>
      <Outlet />
    </div>
  )
}
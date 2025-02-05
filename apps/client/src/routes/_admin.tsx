import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Toaster as Sonner } from 'sonner'
export const Route = createFileRoute('/_admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <>
    <Outlet />
    <Sonner richColors expand />
  </>
}

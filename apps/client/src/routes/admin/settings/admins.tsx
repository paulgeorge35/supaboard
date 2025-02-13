import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/admins')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <div className='p-8 gap-2 vertical border-b'>
        <h1 className='text-2xl'>Admins</h1>
        <p className='text-sm text-gray-500 dark:text-zinc-400'>
          Manage who can access Supaboard's admin view and permissions
        </p>
      </div>
      <div className='p-8 md:max-w-2xl'>
        <Outlet />
      </div>
    </div>
  )
}

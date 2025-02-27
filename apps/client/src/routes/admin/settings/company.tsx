import { createFileRoute, Link, Outlet, useLocation, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin/settings/company')({
  component: RouteComponent,
})

const CompanyLinks = [
  {
    label: 'Branding',
    to: '/admin/settings/company/branding',
  },
  {
    label: 'Preferences',
    to: '/admin/settings/company/preferences',
  },
  {
    label: 'Delete',
    to: '/admin/settings/company/delete',
  }
]

function RouteComponent() {
  const router = useRouter()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/admin/settings/company') {
      router.navigate({ to: '/admin/settings/company/branding' })
    }
  }, [location.pathname])

  return (
    <div className='relative h-[calc(100dvh-72px)] vertical items-start'>
      <div className='p-8 gap-2 vertical border-b sticky left-0 max-w-screen bg-white dark:bg-zinc-900 z-10 w-full'>
        <h1 className='text-2xl'>General</h1>
        <p className='text-sm text-gray-500 dark:text-zinc-400'>
          Manage your workspace's settings
        </p>
      </div>
      <div className='grid grid-cols-[auto_1fr] overflow-y-auto grow'>
        <div className='vertical gap-2 p-8'>
          {CompanyLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className='text-sm font-medium px-2 py-1 rounded-md relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
              activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] bg-[var(--color-primary)]/10' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className='p-8 max-w-2xl min-w-screen md:min-w-full'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

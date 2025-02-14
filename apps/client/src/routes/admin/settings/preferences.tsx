import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/admin/settings/preferences')({
  component: RouteComponent,
})

const PreferenceLinks = [
  { label: 'Email preferences', to: '/admin/settings/preferences/email' },
  { label: 'Language preferences', to: '/admin/settings/preferences/language' },
]

function RouteComponent() {
  const router = useRouter()

  useEffect(() => {
    if (router.state.location.pathname === '/admin/settings/preferences') {
      router.navigate({ to: '/admin/settings/preferences/email' })
    }
  }, [router])

  return (
    <div className='relative'>
      <div className='p-8 gap-2 vertical border-b sticky left-0 top-0 max-w-screen bg-white dark:bg-zinc-900 z-10'>
        <h1 className='text-2xl'>Preferences</h1>
        <p className='text-sm text-gray-500 dark:text-zinc-400'>
          Manage your preferences
        </p>
      </div>
      <div className='grid grid-cols-[auto_1fr]'>
        <div className='vertical gap-2 p-8'>
          {PreferenceLinks.map((link) => (
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
        <div className='p-8 md:max-w-2xl min-w-screen md:min-w-full'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

import { ThemeToggle } from '@/components'
import { AdminAuthButtons, PublicButton } from '@/components/admin'
import { useAuthStore } from '@/stores/auth-store'
import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster as Sonner } from 'sonner'

export const Route = createFileRoute('/admin')({
  component: RouteComponent,
  loader: () => {
    document.documentElement.style.setProperty('--color-primary', '#a684ff')
  }
})

function RouteComponent() {
  const { user, application, workspaces } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const theme = localStorage.getItem('adminCurrentTheme')
    if (theme === 'system') {
      localStorage.removeItem('adminCurrentTheme')
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      localStorage.adminCurrentTheme = theme
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [application?.preferredTheme])

  useEffect(() => {
    document.documentElement.style.setProperty('--user-color-primary', application?.color ?? '#a684ff')
  }, [application?.color])

  useEffect(() => {
    document.title = `${application?.name} | Admin Dashboard`
  }, [application?.name])

  useEffect(() => {
    if (application && !user) {
      router.navigate({ to: '/', replace: true })
    }
  }, [user, application])

  return (
    <span className='vertical h-[100dvh]'>
      <nav className="flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-18 overflow-x-auto overflow-y-hidden">
        <span className='horizontal gap-2 center-v'>
          <Link to="/admin" activeOptions={{ exact: true }} className='button button-navigation font-medium gap-0 text-base'>
            supa<span className='text-violet-400 font-bold underline'>board</span>
          </Link>
          <Link to="/admin/feedback" className='button button-navigation'>Feedback</Link>
          <Link to="/admin/roadmap" className='button button-navigation'>Roadmap</Link>
          <Link to="/admin/users" className='button button-navigation'>Users</Link>
          <Link to="/admin/changelog" className='button button-navigation'>Changelog</Link>
        </span>
        <span className='horizontal center-v gap-2 ml-2'>
          <PublicButton />
          <ThemeToggle />
          <AdminAuthButtons user={user} workspaces={workspaces} currentWorkspace={application?.id} />
        </span>
      </nav>
      <Outlet />
      <Sonner richColors expand theme={localStorage.getItem('adminCurrentTheme') as 'light' | 'dark' | 'system'} />
    </span>
  )
}

import { ThemeToggle } from '@/components'
import { AdminAuthButtons, PublicButton } from '@/components/admin'
import { meQuery } from '@/routes/__root'
import { useAuthStore } from '@/stores/auth-store'
import { QueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster as Sonner } from 'sonner'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const queryClient = new QueryClient();
    queryClient.ensureQueryData(meQuery);
  },
  component: RouteComponent,
  loader: () => {
    document.documentElement.style.setProperty('--color-primary', '#a684ff')
  }
})

function RouteComponent() {
  const { user, application } = useAuthStore()

  useEffect(() => {
    const theme = application?.preferredTheme.toLowerCase()
    if (theme === 'system') {
      localStorage.removeItem('currentTheme')
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      localStorage.currentTheme = theme
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [application?.preferredTheme])

  if (!user) {
    return <Navigate to="/" />
  }

  return (
    <span className='vertical h-[100dvh]'>
      <nav className="flex items-center justify-between p-4 fixed top-0 left-0 right-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-18">
        <span className='horizontal gap-2 center-v'>
          <Link to="/admin" activeOptions={{ exact: true }} className='button button-navigation font-medium gap-0 text-base'>
            supa<span className='text-violet-400 font-bold underline'>board</span>
          </Link>
          <Link to="/admin/feedback" className='button button-navigation'>Feedback</Link>
          <Link to="/admin/roadmap" className='button button-navigation'>Roadmap</Link>
          <Link to="/admin/users" className='button button-navigation'>Users</Link>
          <Link to="/admin/changelog" className='button button-navigation'>Changelog</Link>
        </span>
        <span className='horizontal center-v gap-2'>
          <PublicButton />
          <ThemeToggle />
          <AdminAuthButtons isAdmin={user?.id === application?.ownerId} user={user} />
        </span>
      </nav>
      <Outlet />
      <Sonner richColors expand />
    </span>
  )
}

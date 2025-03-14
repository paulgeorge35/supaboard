import { NotFoundPage, ThemeToggle } from '@/components'
import { AdminAuthButtons, PublicButton } from '@/components/admin'
import { Logo } from '@/components/logo'
import { meQuery } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { QueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate, notFound, Outlet, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster as Sonner } from 'sonner'

export const Route = createFileRoute('/admin')({
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage title="Unauthorized" description="You are not authorized to access this page." />,
  loader: async ({ context }) => {
    document.documentElement.style.setProperty('--color-primary', '#a684ff');
    const me = await context.queryClient.fetchQuery(meQuery)

    if (!me || !me.application.role || !['ADMIN', 'COLLABORATOR'].includes(me.application.role)) {
      throw notFound()
    }
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

  if (application?.role !== undefined && (application.role === null || !['ADMIN', 'COLLABORATOR'].includes(application.role))) {
    return <Navigate to="/" />
  }

  return (
    <span className='vertical h-[100dvh]'>
      <nav className="flex items-center justify-between fixed top-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 h-18 overflow-x-auto overflow-y-hidden">
        <span className='horizontal gap-2 center-v h-full'>
          <Link to="/admin" activeOptions={{ exact: true }} className='button button-navigation h-full w-auto aspect-square center-v rounded-none font-medium gap-0 text-base'>
            <Logo className='size-6 stroke-0' />
          </Link>
          <span className='horizontal gap-2 center-v p-4'>
            <Link to="/admin/feedback" className='button button-navigation'>Feedback</Link>
            <Link to="/admin/roadmap" className='button button-navigation'>Roadmap</Link>
            <Link to="/admin/users" className='button button-navigation'>Users</Link>
            <Link to="/admin/changelog" className='button button-navigation'>Changelog</Link>
          </span>
        </span>
        <span className='horizontal center-v gap-2 ml-2 pr-4'>
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

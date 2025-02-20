import { AdminButton, AuthButtons, Icons, NotFoundPage } from '@/components'
import { PoweredBy } from '@/components/powered-by'
import { applicationBoardsQuery } from '@/lib/query/application'
import { useAuthStore } from '@/stores/auth-store'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Toaster as Sonner } from 'sonner'

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
  notFoundComponent: () => <NotFoundPage />,
})

function RouteComponent() {
  const params = useParams({
    strict: false,
  })

  const { data: boards } = useSuspenseQuery(applicationBoardsQuery)
  const { application, user, workspaces } = useAuthStore();

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

  useEffect(() => {
    document.title = `${application?.name} | Feedback Board`
  }, [application?.icon, application?.name])

  useEffect(() => {
    if (application?.color) {
      document.documentElement.style.setProperty('--color-primary', application.color)
    }
  }, [application?.color])

  const defaultBoardSlug = params?.boardSlug ?? boards[0]?.slug ?? '/';

  return (
    <div className='vertical justify-between h-full'>
      <div className="vertical justify-end gap-2 text-lg max-w-4xl mx-auto w-full pt-4 z-[1]">
        <div className='horizontal center-v gap-2 justify-between px-4 md:px-0'>
          <span className='horizontal gap-2 center-v'>
            {application?.logo && <img src={application?.logo} alt={application?.name} className='size-8' />}
            <h1 className='text-2xl font-medium'>{application?.name}</h1>
          </span>
          <span className='horizontal gap-2 center-v'>
            <AdminButton isAdmin={user?.id === application?.ownerId} />
            <AuthButtons user={user} isAdmin={user?.id === application?.ownerId} workspaces={workspaces} currentWorkspace={application?.id} />
          </span>
        </div>
        <div className="horizontal items-end gap-2 text-lg max-w-4xl mx-auto w-full">
          <Link
            to="/"
            activeProps={{
              className: '!border-[var(--color-primary)] !text-[var(--color-primary)] [&>svg]:!stroke-[var(--color-primary)]',
            }}
            className='-mb-[1px] border-b-[1px] border-transparent font-medium text-gray-400 px-3 py-2 text-sm horizontal center-v gap-2 [&>svg]:stroke-gray-400'
            activeOptions={{ exact: true }}
          >
            <Icons.Map className='size-4' />
            Roadmap
          </Link>
          <Link
            to="/$boardSlug"
            params={{
              boardSlug: defaultBoardSlug,
            }}
            activeProps={{
              className: '!border-[var(--color-primary)] !text-[var(--color-primary)] [&>svg]:!stroke-[var(--color-primary)]',
            }}
            className='-mb-[1px] border-b-[1px] border-transparent font-medium text-gray-400 px-3 py-2 text-sm horizontal center-v gap-2 [&>svg]:stroke-gray-400'
          >
            <Icons.Lightbulb className='size-4' />
            Feedback
          </Link>
          {application?.hasChangelog && (
            <Link
              to="/changelog"
              className='-mb-[1px] border-b-[1px] border-transparent font-medium text-gray-400 px-3 py-2 text-sm horizontal center-v gap-2 [&>svg]:stroke-gray-400'
              activeProps={{
                className: '!border-[var(--color-primary)] !text-[var(--color-primary)] [&>svg]:!stroke-[var(--color-primary)]',
              }}
            >
              <Icons.RefreshCcw className='size-4' />
              Changelog
            </Link>
          )}
        </div>
      </div>
      <hr className='z-[0]' />
      <div className="vertical gap-4 max-w-4xl mx-auto w-full py-8 px-4 md:px-0">
        <Outlet />
      </div>
      <PoweredBy className='mt-auto mx-auto pb-8' />
      <Sonner richColors expand theme={application?.preferredTheme.toLowerCase() as 'system' | 'dark' | 'light'} />
    </div>
  )
}

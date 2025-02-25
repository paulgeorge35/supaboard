import { cn } from '@/lib/utils'
import { createFileRoute, Link, Outlet, useLocation, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'

export const Route = createFileRoute('/admin/settings/roadmap')({
    component: RouteComponent,
})

function RouteComponent() {
    const router = useRouter()
    const location = useLocation()

    useEffect(() => {
        if (router.state.location.pathname === '/admin/settings/roadmap') {
            router.navigate({ to: '/admin/settings/roadmap/public', replace: true })
        }
    }, [router])

    const isWide = useMemo(() => location.pathname.endsWith('/admin/settings/roadmap/statuses'), [location.pathname])

    return (
        <div className='relative h-[calc(100dvh-72px)] vertical items-start'>
            <div className='p-8 gap-2 vertical border-b sticky left-0 max-w-screen bg-white dark:bg-zinc-900 z-10 w-full'>
                <h1 className='text-2xl'>Roadmap and statuses</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Manage your roadmaps and status labels.
                </p>
            </div>
            <div className={cn('grid grid-cols-[auto_1fr] overflow-y-auto grow', {
                'grid-cols-[auto_auto]': isWide,
            })}>
                <div className='vertical gap-2 p-8'>
                    <Link
                        to='/admin/settings/roadmap/public'
                        className='text-sm font-medium px-2 py-1 rounded-md relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] bg-[var(--color-primary)]/10' }}
                    >
                        Public Roadmap
                    </Link>
                    <Link
                        to='/admin/settings/roadmap/statuses'
                        className='text-sm font-medium px-2 py-1 rounded-md relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] bg-[var(--color-primary)]/10' }}
                    >
                        Statuses
                    </Link>
                    <Link
                        to='/admin/settings/roadmap/archive'
                        className='text-sm font-medium px-2 py-1 rounded-md relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] bg-[var(--color-primary)]/10' }}
                    >
                        Archive
                    </Link>
                </div>
                <div className={cn('p-8 max-w-2xl min-w-screen md:min-w-full', {
                    "max-w-none": isWide,
                })}>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

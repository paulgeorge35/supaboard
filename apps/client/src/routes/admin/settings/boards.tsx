import { Icons } from '@/components'
import { Popover } from '@/components/popover'
import { useAuthStore } from '@/stores/auth-store'
import { createFileRoute, Link, Outlet, useParams, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'

export const Route = createFileRoute('/admin/settings/boards')({
  component: RouteComponent,
})

const BoardLinks = [
  {
    label: 'General',
    to: '/admin/settings/boards/$boardSlug/general',
  },
  {
    label: 'Create Form',
    to: '/admin/settings/boards/$boardSlug/create-form',
  },
  {
    label: 'Privacy',
    to: '/admin/settings/boards/$boardSlug/privacy',
  },
  {
    label: 'Tags',
    to: '/admin/settings/boards/$boardSlug/tags',
  },
  {
    label: 'Categories',
    to: '/admin/settings/boards/$boardSlug/categories',
  },
  {
    label: 'Delete',
    to: '/admin/settings/boards/$boardSlug/delete',
  }
]
function RouteComponent() {
  const { application } = useAuthStore()
  const router = useRouter()
  const { boardSlug } = useParams({ strict: false });

  const boards = useMemo(() => application?.boards.map((board) => ({
    label: board.name,
    value: board.slug,
    onClick: () => {
      let subpath = window.location.pathname.split('/').pop();
      router.navigate({ to: '/admin/settings/boards/$boardSlug/' + subpath, params: { boardSlug: board.slug } })
    }
  })) ?? [], [application])

  const activeBoard = useMemo(() => application?.boards.find((board) => board.slug === boardSlug), [application, boardSlug])

  useEffect(() => {
    if (!boardSlug) {
      router.navigate({ to: '/admin/settings/boards/$boardSlug/general', params: { boardSlug: boardSlug ?? boards[0].value }, replace: true })
    }
  }, [boardSlug, boards, router])

  return (
    <div>
      <div className='p-8 gap-2 vertical border-b'>
        <span className='horizontal gap-8'>
          <h1 className='text-2xl'>Board Settings</h1>
          <Popover
            id='board-selector'
            triggerClassName='w-40'
            trigger={
              <div className='text-sm font-light rounded-md px-2 py-1 border horizontal space-between center-v gap-1 w-40 hover:bg-gray-100 dark:hover:bg-zinc-800/20 transition-colors duration-150 cursor-pointer'>
                {activeBoard?.name}
                <Icons.ChevronDown className='size-3' />
              </div>
            }
            content={
              <div className='flex flex-col gap-1 w-40'>
                {boards.map((board) => (
                  <button
                    key={board.value}
                    data-popover-close
                    onClick={board.onClick}
                    disabled={board.value === boardSlug}
                    className='block text-nowrap w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 transition-colors duration-150'
                  >{board.label}</button>
                ))}
              </div>
            }
          />
        </span>
        <p className='text-sm text-gray-500 dark:text-zinc-400'>
          Manage and organize your feedback boards
        </p>
      </div>
      <div className='grid grid-cols-[auto_1fr]'>
        <div className='vertical gap-2 p-8'>
          {BoardLinks.map((link) => (
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
        <div className='p-8 md:max-w-2xl'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

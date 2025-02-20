import { useAuthStore } from '@/stores/auth-store';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/settings')({
  component: RouteComponent,
})

const PersonalLinks = [
  {
    label: 'Profile',
    to: '/admin/settings/profile',
  },
  {
    label: 'Preferences',
    to: '/admin/settings/preferences',
  },
]

const CompanyLinks = [
  {
    label: 'General',
    to: '/admin/settings/company',
  },
  {
    label: 'Admins',
    to: '/admin/settings/admins/people',
  },
  {
    label: 'Boards',
    to: '/admin/settings/boards',
  },
  {
    label: 'Changelog',
    to: '/admin/settings/changelog',
  },
  {
    label: 'Custom Domains',
    to: '/admin/settings/custom-domains',
  },
]

function RouteComponent() {
  const { application } = useAuthStore();

  return (
    <div className="grid grid-cols-[minmax(200px,250px)_1fr] w-full h-full max-h-[full] pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full border-r">
        <div className="vertical gap-8 p-4">
          <span className='vertical gap-2'>
            <h1 className='uppercase text-sm font-bold'>Personal</h1>
            {PersonalLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className='text-sm font-medium py-1 relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] [&>span]:bg-[var(--color-primary)]/10 [&>span]:block' }}
              >
                {link.label}
                <span className='absolute top-0 -left-[17px] w-[calc(100%+34px)] h-full hidden' />
              </Link>
            ))}
          </span>
          <span className='vertical gap-2'>
            <h1 className='uppercase text-sm font-bold'>{application?.name}</h1>
            {CompanyLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className='text-sm font-medium py-1 relative text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                activeProps={{ className: '!text-[var(--color-primary)] !dark:text-[var(--color-primary)] [&>span]:bg-[var(--color-primary)]/10 [&>span]:block' }}
              >
                {link.label}
                <span className='absolute top-0 -left-[17px] w-[calc(100%+34px)] h-full hidden' />
              </Link>
            ))}
          </span>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

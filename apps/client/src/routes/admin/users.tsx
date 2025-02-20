import { Avatar, Icons, LoadingSpinner, Skeleton } from '@/components'
import { UserDetails } from '@/components/admin/users/profile/user-details'
import { UserHeader } from '@/components/admin/users/profile/user-header'
import { DateRange } from '@/components/admin/users/sidebar/date'
import { Filters } from '@/components/admin/users/sidebar/filters'
import { Sort } from '@/components/admin/users/sidebar/sort'
import { MembersDetail, membersInfiniteQuery, MembersPage } from '@/lib/query/user'
import { cn } from '@/lib/utils'
import { useDebounce, useVisibility, UseVisibility } from '@paulgeorge35/hooks'
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useParams, useRouter, useSearch } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

const userSearchSchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional(),
  take: z.number().optional(),
  order: z.enum(['last-activity', 'top-posters', 'top-voters']).optional(),
  filter: z.array(z.enum(['posts', 'votes', 'comments'])).optional(),
  start: z.string().optional(),
  end: z.string().optional()
})

export const Route = createFileRoute('/admin/users')({
  validateSearch: zodValidator(userSearchSchema),
  component: RouteComponent,
})

function RouteComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { userSlug } = useParams({ strict: false });

  const search = useSearch({ from: Route.fullPath })
  const { value: debouncedSearch } = useDebounce(searchQuery);

  const { data, isLoading, fetchNextPage, isFetchingNextPage } = useInfiniteQuery(membersInfiniteQuery({
    ...search,
    search: debouncedSearch,
  }))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const user = useMemo(() => data?.pages[0].data.find((user) => user.id === userSlug), [data, userSlug])
  const users: MembersDetail[] = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])

  useEffect(() => {
    if (!userSlug && users.length > 0) {
      router.navigate({
        to: "/admin/users/$userSlug",
        params: { userSlug: users[0].id }
      })
    }
  }, [userSlug, users, router])

  return (
    <div className="grid grid-cols-[minmax(200px,250px)_minmax(300px,360px)_minmax(300px,1fr)_minmax(380px,400px)] w-full h-full max-h-full pt-18">
      <div className="col-span-1 vertical gap-2 overflow-y-auto h-full sticky left-0">
        <div className="vertical gap-8 p-4">
          <DateRange />
          <Sort />
          <Filters />
        </div>
      </div>

      <div className="col-span-1 overflow-y-auto border-l bg-white dark:bg-zinc-900 z-10" style={{ transform: 'translate3d(0, 0, 0)' }}>
        <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900">
            <div className='p-4 border-b'>
              <span className='pl-2 py-1 horizontal center-v gap-2 bg-gray-100 dark:bg-zinc-800 rounded-md'>
                <Icons.Search className='size-4 stroke-gray-500 dark:stroke-zinc-400' />
                <input type="text" placeholder='Search...' className='w-full focus:outline-none pr-2 py-1 pl-0 md:text-sm font-light' value={searchQuery} onChange={handleChange} />
              </span>
            </div>
            <UserList searchQuery={debouncedSearch} data={data} isLoading={isLoading} fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
          </div>
        </div>
      </div>
      <Outlet />

      <div className="col-span-1 overflow-y-auto border-l bg-white dark:bg-zinc-900 z-10">
        {user && <div className="vertical gap-2 h-full">
          <div className="w-full h-full bg-white dark:bg-zinc-900">
            <UserHeader user={user} />
            <UserDetails userId={user.id} />
          </div>
        </div>}
      </div>
    </div>
  )
}

type UserListProps = {
  searchQuery: string;
  data?: InfiniteData<MembersPage, unknown>;
  isLoading: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

function UserList({ data, isLoading, fetchNextPage, isFetchingNextPage }: UserListProps) {

  const handleFetchNextPage = (params: UseVisibility<HTMLDivElement>) => {
    if (params.isVisible && data?.pages[data?.pages.length - 1]) {
      fetchNextPage()
    }
  }
  const { ref } = useVisibility<HTMLDivElement>({
    threshold: 50,
  }, handleFetchNextPage)

  const users: MembersDetail[] = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data])


  if (isLoading) {
    return Array.from({ length: 1 }).map((_, index) => (
      <div key={index} className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full">
          <div className="w-full h-full vertical center">
            <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
          </div>
        </Skeleton>
      </div>
    ))
  }

  if (!users.length) {
    return <div className="w-full h-full">
      <span className="w-full h-full vertical center">
        <Icons.MessageSquare className="size-10 stroke-gray-500 dark:stroke-zinc-400" />
        <p className="text-gray-500 dark:text-zinc-400 p-4 text-center font-light">No users found</p>
      </span>
    </div>
  }

  return (
    <>
      {users.map((user, index) => (
        <UserCard key={user.id} user={user} ref={index === users.length - 1 ? ref : undefined} />
      ))}
      {isFetchingNextPage && <div className="w-full h-32 border-b mb-[2px]">
        <Skeleton className="w-full h-full vertical center">
          <LoadingSpinner className='stroke-gray-500 dark:stroke-zinc-400 size-10' />
        </Skeleton>
      </div>}
    </>
  )
}

type UserCardProps = {
  user: MembersDetail
  ref?: React.RefObject<HTMLDivElement>
}

export function UserCard({ user, ref }: UserCardProps) {
  const search = useSearch({ from: "/admin/users" });
  const { id, name, email, avatar } = user;

  return (
    <>
      <Link
        preload={false}
        to={"/admin/users/$userSlug"}
        params={{ userSlug: id }}
        search={search}
        activeProps={{ className: "[&>div]:!bg-[var(--color-primary)]/10 dark:[&>div]:!bg-[var(--color-primary)]/10" }}
      >
        <div ref={ref} className={cn("p-4 border-zinc-200 dark:border-zinc-800 horizontal center-v gap-2 bg-white dark:bg-zinc-900 hover:bg-gray-300/20 dark:hover:bg-zinc-800/20 transition-colors duration-200")}>
          <Avatar src={avatar ?? undefined} name={name} className='size-10' />
          <span className='vertical'>
            <h1 className="text-sm font-medium">{name}</h1>
            <p className="text-sm text-gray-500 line-clamp-2">
              {email}
            </p>
          </span>
        </div>
      </Link>
      <hr />
    </>
  )
}
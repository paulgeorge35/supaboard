import { NotFoundPage } from '@/components'
import { meQuery } from '@/lib/query/auth'
import { useAuthStore } from '@/stores/auth-store'
import { QueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createRootRoute, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
export const Route = createRootRoute({
  notFoundComponent: () => <NotFoundPage redirect="https://supaboard.io" />,
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  component: () => {
    const { data } = useSuspenseQuery(meQuery)
    const { setUser, setApplication, setWorkspaces } = useAuthStore()

    useEffect(() => {
      setUser(data?.user)
      setApplication(data?.application)
      setWorkspaces(data?.workspaces)
    }, [data?.user, data?.application, data?.workspaces, setUser, setApplication, setWorkspaces])

    useEffect(() => {
      if (data?.application?.icon) {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = data?.application?.icon
        document.head.appendChild(link)
      }
      else {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = '/favicon.ico'
        document.head.appendChild(link)
      }
    }, [data?.application?.icon])

    useEffect(() => {
      if (!data?.application) {
        throw notFound()
      }
    }, [data?.application])

    return <RootComponent />
  },
})

function RootComponent() {
  return (
    <div className='h-[100dvh] vertical'>
      <Outlet />
      {/* {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />} */}
    </div>
  )
}

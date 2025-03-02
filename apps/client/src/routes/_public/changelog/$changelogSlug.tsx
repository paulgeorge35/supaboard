import { Button, Icons, NotFoundPage, Skeleton } from '@/components'
import { ChangelogContent } from '@/components/admin/changelog/changelog-renderer'
import { useLikeChangelogMutation } from '@/lib/mutation'
import { changelogPublicBySlugQuery } from '@/lib/query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_public/changelog/$changelogSlug')({
  context: () => {
    const queryClient = new QueryClient()
    return {
      queryClient,
    }
  },
  loader: async ({ context, params }) => {
    const { queryClient } = context;
    const changelog = await queryClient.fetchQuery(changelogPublicBySlugQuery(params.changelogSlug))
    if (!changelog) {
      throw notFound();
    }
    return { data: changelog, isLoading: false };
  },
  notFoundComponent: () => <NotFoundPage redirect='/changelog' title='Changelog not found' description='The changelog you are looking for does not exist.' />,
  component: RouteComponent,
})

function ChangelogSkeleton() {
  return (
    <div className='vertical gap-4'>
      <div className='vertical gap-2'>
        <Skeleton className="h-8 w-3/4 rounded-md" />

        <div className="vertical gap-2 mt-4">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-4/6 rounded-md" />
        </div>

        <div className="horizontal gap-2 mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <span className='horizontal gap-2 center-v mt-4'>
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-12" />
          <span className='ml-auto'>
            <Skeleton className="h-6 w-24 rounded-md" />
          </span>
        </span>
      </div>
    </div>
  )
}

function RouteComponent() {
  const { user } = useAuthStore()
  const { changelogSlug } = useParams({ from: '/_public/changelog/$changelogSlug' })
  const { data: changelog, isLoading } = useQuery(changelogPublicBySlugQuery(changelogSlug))
  const { mutate: likeChangelog } = useLikeChangelogMutation()

  const handleLikeChangelog = ({
    changelogSlug,
    likedByMe,
    likes
  }: {
    changelogSlug: string
    likedByMe: boolean
    likes: number
  }) => {
    if (!user) {
      toast.error('You must be logged in to like a changelog')
      return
    }
    likeChangelog({
      changelogSlug,
      likedByMe,
      likes
    })
  }

  return (
    <div className='grid md:grid-cols-[minmax(300px,1fr)_2fr] gap-8'>
      <div className='vertical gap-2 hidden md:flex'>
        <Link to='/changelog' className='horizontal gap-2 center-v bg-gray-100 dark:bg-zinc-800 p-2 rounded-md text-sm font-light text-gray-500 dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors'>
          <Icons.ArrowRight className='size-4 rotate-180 stroke-gray-500 dark:stroke-zinc-400' />
          Back to changelog
        </Link>
      </div>

      {isLoading ? (
        <ChangelogSkeleton />
      ) : changelog ? (
        <div className='vertical gap-4'>
          <div className='vertical gap-2'>
            <ChangelogContent
              changelog={changelog}
              status={changelog.status}
              publishedAt={changelog.publishedAt}
            />
            <span className='horizontal gap-2 center-v'>
              <Button variant='outline' size='icon'
                onClick={() => handleLikeChangelog({
                  changelogSlug: changelog.slug,
                  likedByMe: changelog.likedByMe,
                  likes: changelog.likes
                })}
                className='group'
              >
                <Icons.Heart className={cn('size-4 group-hover:fill-gray-500 dark:group-hover:fill-zinc-400 transition-colors', {
                  '!fill-red-500 !stroke-red-500': changelog.likedByMe,
                })} />
              </Button>
              {changelog.likes > 0 && <span className='text-sm text-gray-500 dark:text-zinc-400'>{changelog.likes} {changelog.likes === 1 ? 'like' : 'likes'}</span>}
              <span className='ml-auto text-sm font-light text-gray-500 dark:text-zinc-400 horizontal gap-2 center-v'>
                <Icons.ChartNoAxesColumn className='size-6 rounded-full bg-gray-100 dark:bg-zinc-800 p-1' />{changelog.views} Views
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

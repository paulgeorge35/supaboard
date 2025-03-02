import { Button, Icons } from "@/components"
import { ChangelogContent } from "@/components/admin/changelog/changelog-renderer"
import { useLikeChangelogMutation } from "@/lib/mutation"
import { ChangelogPublic } from "@/lib/query"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { Link } from "@tanstack/react-router"
import { DateTime } from "luxon"
import { toast } from "sonner"

type ChangelogItemProps = {
    changelog: ChangelogPublic;
}

export const ChangelogItem = ({ changelog }: ChangelogItemProps) => {
    const { user } = useAuthStore()
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
        likeChangelog({ changelogSlug, likedByMe, likes })
    }

    return (
        <div key={changelog.id} className='grid grid-cols-subgrid col-span-full'>
            <h2 className='text-sm text-gray-500 dark:text-zinc-400 hidden md:flex'>
                {changelog.publishedAt ? DateTime.fromJSDate(new Date(changelog.publishedAt)).toFormat('MMMM dd, yyyy') : 'Unpublished'}
            </h2>
            <div className='vertical gap-2'>
                <Link to='/changelog/$changelogSlug' params={{ changelogSlug: changelog.slug }}>
                    <ChangelogContent changelog={changelog} status={changelog.status} publishedAt={changelog.publishedAt} slug={changelog.slug} preview />
                </Link>
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
    )
}
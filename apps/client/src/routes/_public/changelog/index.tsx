import { Button } from '@/components/button'
import { Icons } from '@/components/icons'
import { ChangelogItem } from '@/components/public/changelog/changelog-item'
import { ChangelogItemSkeleton } from '@/components/public/changelog/changelog-item-skeleton'
import { useSubscribeChangelogMutation } from '@/lib/mutation'
import { changelogPublicQuery } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/_public/changelog/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { application } = useAuthStore();
    const { data, isLoading } = useQuery(changelogPublicQuery)

    if (isLoading) {
        return (
            <div className='vertical gap-4'>
                <Header />
                {Array.from({ length: 5 }).map((_, index) => (
                    <ChangelogItemSkeleton key={index} />
                ))}
            </div>
        )
    }

    if (!application?.hasChangelog) {
        throw notFound();
    }

    return (
        <div className='vertical gap-4'>
            <Header isSubscribed={data?.isSubscribed} />

            <div className='grid grid-cols-[auto_1fr] gap-8'>
                {data?.changelogs?.map((changelog) => (
                    <ChangelogItem key={changelog.id} changelog={changelog} />
                ))}
            </div>
        </div>
    )
}

const Header = ({ isSubscribed }: { isSubscribed?: boolean }) => {
    const { user } = useAuthStore();

    const { mutate: subscribe, isPending: isSubscribing } = useSubscribeChangelogMutation({
        onSuccess: (data) => {
            toast.success(data.isSubscribed ? 'Subscribed to changelogs' : 'Unsubscribed from changelogs');
        }
    });

    return (
        <>
            <span className='grid grid-cols-[1fr_auto] gap-4'>
                <span className='vertical gap-1'>
                    <h1 className='text-4xl font-light'>Changelog</h1>
                    <p className='text-sm text-gray-500 dark:text-zinc-400'>Follow up on the latest improvements and updates.</p>
                </span>
                {user && (
                    <span className='vertical center-v gap-1'>
                        <Button
                            onClick={() => subscribe()}
                            isLoading={isSubscribing || isSubscribed === undefined}
                            color={isSubscribed ? 'secondary' : 'primary'}
                            variant={isSubscribed ? 'outline' : 'default'}
                            size='sm'
                        >
                            <Icons.Bell className='size-4' />
                            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                        </Button>
                    </span>
                )}
            </span>
            <hr />
        </>
    )
}
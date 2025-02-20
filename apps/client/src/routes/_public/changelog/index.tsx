import { ChangelogItem } from '@/components/public/changelog/changelog-item'
import { ChangelogItemSkeleton } from '@/components/public/changelog/changelog-item-skeleton'
import { changelogPublicQuery } from '@/lib/query'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/changelog/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { data: changelogs, isLoading } = useQuery(changelogPublicQuery)

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
    
    return (
        <div className='vertical gap-4'>
            <Header />

            <div className='grid grid-cols-[auto_1fr] gap-8'>
                {changelogs?.map((changelog) => (
                    <ChangelogItem key={changelog.id} changelog={changelog} />
                ))}
            </div>
        </div>
    )
}

const Header = () => {
    return (
        <>
            <span className='vertical gap-1'>
                <h1 className='text-4xl font-light'>Changelog</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>Follow up on the latest improvements and updates.</p>
            </span>
            <hr />
        </>
    )
}
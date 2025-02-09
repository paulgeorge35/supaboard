import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/settings/custom-domains/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div>
            <div className='p-8 gap-2 vertical border-b'>
                <h1 className='text-2xl'>Custom Domains</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Manage your workspace's custom domains
                </p>
            </div>
        </div>
    )
}

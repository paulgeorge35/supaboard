import { ModalComponent } from '@/components/modal-component';
import { useDeleteRoadmapMutation } from '@/lib/mutation/roadmap';
import { createFileRoute, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { Button } from 'react-aria-components';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/delete')({
    component: RouteComponent,
})

function RouteComponent() {
    const router = useRouter();
    const { roadmapSlug } = useParams({ from: Route.fullPath })
    const search = useSearch({ from: Route.fullPath })
    const { mutate: deleteRoadmap, isPending: isDeletingRoadmap } = useDeleteRoadmapMutation();

    const onClose = () => {
        router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search });
    }

    return (
        <ModalComponent
            isOpen={true}
            onClose={onClose}
            aria-label="Rename Roadmap"
        >
            <h1 className='text-2xl font-bold'>Delete Roadmap</h1>
            <p className='text-gray-500'>Are you sure you want to delete this roadmap? This action cannot be undone.</p>
            <div className='horizontal gap-4 center-v mt-4 w-full justify-end'>
                <Button
                    onPress={onClose}
                    className='border text-sm rounded-md px-2 py-1 font-light text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-100'
                >
                    Cancel
                </Button>
                <Button
                    onPress={() => deleteRoadmap(roadmapSlug!)}
                    isDisabled={isDeletingRoadmap}
                    className='rounded-md text-sm px-2 py-1 bg-[var(--color-primary)] text-zinc-100 hover:bg-[var(--color-primary)]/80 transition-colors duration-100 font-light disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Delete
                </Button>
            </div>
        </ModalComponent>
    )
}

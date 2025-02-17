import { FieldInfo, Input } from '@/components';
import { ModalComponent } from '@/components/modal-component';
import { useRenameRoadmapMutation } from '@/lib/mutation';
import { roadmapQuery } from '@/lib/query';
import { useForm } from '@tanstack/react-form';
import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, useParams, useRouter } from '@tanstack/react-router';
import { Button } from 'react-aria-components';
import { z } from 'zod';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/rename')({
    context: () => {
        const queryClient = new QueryClient()
        return {
            queryClient,
        }
    },
    loader: async ({ params, context }) => await context.queryClient.ensureQueryData(roadmapQuery(params.roadmapSlug)),
    component: RouteComponent
})

function RouteComponent() {
    const routeApi = getRouteApi(Route.fullPath);
    const data = routeApi.useLoaderData();
    const router = useRouter();
    const { roadmapSlug } = useParams({ from: Route.fullPath })
    const { mutate: renameRoadmap, isPending: isRenamingRoadmap } = useRenameRoadmapMutation(roadmapSlug, routeApi.useRouteContext().queryClient);

    const schema = z.object({
        name: z.string({
            required_error: 'Name is required'
        }).min(3, 'Name must be at least 3 characters long').max(50, 'Name must be less than 50 characters long')
    });

    const form = useForm({
        defaultValues: {
            name: data.name,
        },
        validators: {
            onChange: schema,
        },
        onSubmit: async (values) => {
            renameRoadmap(values.value.name);
        }
    });

    const onClose = () => {
        router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug } });
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    }

    return (
        <ModalComponent
            isOpen={true}
            onClose={onClose}
            aria-label="Rename Roadmap"
        >
            <form onSubmit={handleSubmit} className='vertical gap-2 items-start'>
                <h1 className='text-2xl font-bold'>Rename Roadmap</h1>
                <p className='text-gray-500'>Enter a new name for the roadmap</p>
                <form.Field
                    name='name'
                    children={(field) => (
                        <>
                            <Input
                                label='Roadmap Name'
                                className='w-full'
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                autoFocus
                            />
                            <FieldInfo field={field} />
                        </>
                    )}
                />
                <div className='horizontal gap-4 center-v mt-4 w-full justify-end'>
                    <Button
                        onPress={onClose}
                        className='border text-sm rounded-md px-2 py-1 font-light text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-100'
                    >
                        Cancel
                    </Button>
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                        children={([canSubmit, isSubmitting, isDirty]) => (
                            <Button
                                type='submit'
                                isDisabled={!canSubmit || !isDirty || isRenamingRoadmap || isSubmitting}
                                className='rounded-md text-sm px-2 py-1 bg-[var(--color-primary)] text-zinc-100 hover:bg-[var(--color-primary)]/80 transition-colors duration-100 font-light disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                Submit
                            </Button>
                        )}
                    />
                </div>
            </form>
        </ModalComponent>
    )
}

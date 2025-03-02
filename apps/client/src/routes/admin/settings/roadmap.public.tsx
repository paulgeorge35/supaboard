import { Button, Checkbox } from '@/components'
import { Switch } from '@/components/switch'
import { useUpdateRoadmapSettingsMutation } from '@/lib/mutation'
import { applicationBoardsQuery, applicationQuery } from '@/lib/query/application'
import { useForm } from '@tanstack/react-form'
import { useQueries } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/admin/settings/roadmap/public')({
    component: RouteComponent,
})


function RouteComponent() {
    const [{ data: application }, { data: boards }] = useQueries({
        queries: [applicationQuery, applicationBoardsQuery],
    });

    const schema = z.object({
        isPublic: z.boolean().optional(),
        includeInRoadmap: z.array(z.string()).optional(),
    })
    const form = useForm({
        validators: {
            onSubmit: schema,
        },
        defaultValues: {
            isPublic: application?.isRoadmapPublic,
            includeInRoadmap: boards?.filter(board => board.includeInRoadmap).map(board => board.slug),
        },
        onSubmit: (data) => {
            updateRoadmapSettings(data.value)
        },
    })

    const { mutate: updateRoadmapSettings, isPending } = useUpdateRoadmapSettingsMutation({
        onSuccess: () => {
            form.reset();
            toast.success('Roadmap settings updated successfully')
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    }

    return (
        <form onSubmit={handleSubmit} className='vertical gap-2 items-start'>
            <div className='w-full grid grid-cols-[1fr_100px] gap-4'>
                <span className='vertical gap-2'>
                    <p className='text-sm font-medium'>Public Roadmap</p>
                    <p className='text-sm font-light text-gray-500 dark:text-zinc-400 text-balance'>
                        Display a public roadmap on your feedback portal. Posts on the public roadmap will be sorted into three columns.
                    </p>
                </span>
                <span className='horizontal gap-2 center-v justify-end'>
                    <form.Field
                        name='isPublic'
                        children={(field) => (
                            <Switch
                                name={field.name}
                                checked={field.state.value}
                                onChange={(e) => field.handleChange(e.target.checked)}
                            />
                        )}
                    />
                </span>
                <hr className='my-2 col-span-full w-full' />
                <span className='vertical gap-2'>

                    <p className='text-sm font-medium'>Board visibility</p>
                    <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
                        Customize visibility on the public roadmap by selecting specific boards. Only users with access to the chosen boards will be able to view them.
                    </p>
                </span>
                <span className='horizontal justify-end center-v'>
                    <form.Subscribe
                        selector={(state) => [state.values.includeInRoadmap]}
                        children={([includeInRoadmap]) => (
                            <Button type='button' disabled={isPending} variant='ghost' color='secondary' size='sm' onClick={() => form.setFieldValue('includeInRoadmap', includeInRoadmap?.length === boards?.length ? [] : boards?.map(board => board.slug))}>
                                {includeInRoadmap?.length === boards?.length ? 'Select none' : 'Select all'}
                            </Button>
                        )}
                    />
                </span>
                <form.Field
                    name='includeInRoadmap'
                    children={(field) => (
                        <div className='grid grid-cols-2 gap-2 py-2'>
                            {boards?.map(board => (
                                <Checkbox
                                    key={board.slug}
                                    disabled={isPending}
                                    label={board.name}
                                    checked={field.state.value?.includes(board.slug)}
                                    onChange={(e) => field.handleChange(e.target.checked ? [...(field.state.value ?? []), board.slug] : field.state.value?.filter(slug => slug !== board.slug))}
                                />
                            ))}
                        </div>
                    )}
                />
            </div>

            <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                children={([canSubmit, isSubmitting, isDirty]) => (
                    <Button className='ml-auto' type='submit' color='primary' isLoading={isSubmitting || isPending} disabled={!canSubmit || !isDirty}>
                        Save
                    </Button>
                )}
            />
        </form >
    )
}

import { Button, RadioGroup } from '@/components'
import { fetchClient } from '@/lib/client'
import { useForm } from '@tanstack/react-form'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/settings/preferences/email')({
    component: RouteComponent,
})

type PreferencesQueryData = {
    user: {
        reportFrequency: 'DAILY' | 'WEEKLY' | 'NEVER'
        language: 'EN' | 'RO'
    }
}

const preferencesQuery = queryOptions<PreferencesQueryData>({
    queryKey: ['preferences'],
    queryFn: () => fetchClient('/auth/preferences')
})

function RouteComponent() {
    const queryClient = useQueryClient()
    const { data } = useQuery(preferencesQuery)

    const { mutate: updatePreferences, isPending } = useMutation({
        mutationFn: (reportFrequency: 'DAILY' | 'WEEKLY' | 'NEVER') => fetchClient('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ reportFrequency })
        }),
        onMutate: (reportFrequency) => {
            queryClient.cancelQueries({ queryKey: preferencesQuery.queryKey })
            const previousData = queryClient.getQueryData<PreferencesQueryData>(preferencesQuery.queryKey)
            queryClient.setQueryData(preferencesQuery.queryKey, (old: PreferencesQueryData | undefined) => {
                if (!old) return undefined
                return {
                    ...old,
                    user: {
                        ...old.user,
                        reportFrequency: reportFrequency
                    }
                }
            })

            return {
                previousData
            }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(preferencesQuery.queryKey, context?.previousData)
        },
        onSuccess: () => {
            toast.success('Preferences updated')
            form.reset()
        }
    })

    const form = useForm({
        defaultValues: {
            reportFrequency: data?.user.reportFrequency ?? 'DAILY'
        },
        onSubmit: (data) => {
            updatePreferences(data.value.reportFrequency)
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    return (
        <div className='vertical gap-2'>
            <h1 className='text-sm font-medium'>Email preferences</h1>
            <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>Set how often you receive email reports from SupaBoard</p>

            <p className='text-sm mt-4'>Receive admin reports:</p>
            <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
                <form.Field
                    name='reportFrequency'
                    children={(field) => (
                        <RadioGroup
                            name={field.name}
                            value={field.state.value}
                            onChange={(value) => field.handleChange(value as 'DAILY' | 'WEEKLY' | 'NEVER')}
                            options={[
                                { label: 'Daily', value: 'DAILY' },
                                { label: 'Weekly', value: 'WEEKLY' },
                                { label: 'Never', value: 'NEVER' },
                            ]}
                        />
                    )}
                />
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                    children={([canSubmit, isSubmitting, isDirty]) => (
                        <Button type='submit' color='primary' isLoading={isSubmitting || isPending} disabled={!canSubmit || !isDirty}>
                            Save
                        </Button>
                    )}
                />
            </form>
        </div>
    )
}

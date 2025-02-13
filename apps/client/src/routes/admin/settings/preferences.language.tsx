import { Button } from '@/components/button'
import { RadioGroup } from '@/components/radio-group'
import { fetchClient } from '@/lib/client'
import { useForm } from '@tanstack/react-form'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/settings/preferences/language')({
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
        mutationFn: (language: 'EN' | 'RO') => fetchClient('/auth/preferences', {
            method: 'PUT',
            body: JSON.stringify({ language })
        }),
        onMutate: (language) => {
            queryClient.cancelQueries({ queryKey: preferencesQuery.queryKey })
            const previousData = queryClient.getQueryData<PreferencesQueryData>(preferencesQuery.queryKey)
            queryClient.setQueryData(preferencesQuery.queryKey, (old: PreferencesQueryData | undefined) => {
                if (!old) return undefined
                return {
                    ...old,
                    user: {
                        ...old.user,
                        language,
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
            language: data?.user.language ?? 'EN'
        },
        onSubmit: (data) => {
            updatePreferences(data.value.language)
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    return (
        <div className='vertical gap-2'>
            <h1 className='text-sm font-medium'>Language preferences</h1>
            <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
                Set the language for your workspace.
            </p>
            <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
                <form.Field
                    name='language'
                    children={(field) => (
                        <RadioGroup
                            name={field.name}
                            value={field.state.value}
                            onChange={(value) => field.handleChange(value as 'EN' | 'RO')}
                            options={[
                                { label: 'English', value: 'EN' },
                                { label: 'Romanian (Coming soon)', value: 'RO', disabled: true },
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

import { FieldInfo, Input } from '@/components'
import { Button } from '@/components/button'
import { fetchClient } from '@/lib/client'
import { boardQuery } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute(
    '/admin/settings/boards/$boardSlug/general',
)({
    component: RouteComponent,
})

function RouteComponent() {
    const router = useRouter()
    const { boardSlug } = useParams({ from: '/admin/settings/boards/$boardSlug/general' })
    const { application } = useAuthStore()

    const { data: board } = useQuery(boardQuery(boardSlug))

    const url = useMemo(() => {
        if (application?.customDomain && application.domainStatus === 'VERIFIED') {
            return `https://${application.customDomain}/`
        }

        return `https://${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}/`
    }, [application])

    const schema = z.object({
        name: z.string({
            required_error: 'Name is required'
        }).min(3, {
            message: 'Name must be at least 3 characters long'
        }),
        slug: z.string({
            required_error: 'Slug is required'
        }).min(3, {
            message: 'URL must be at least 3 characters long'
        }),
        description: z.string().optional(),
    })

    const { mutate: updateBoard, isPending } = useMutation({
        mutationFn: (data: z.infer<typeof schema>) => fetchClient(`board/${boardSlug}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        onSuccess: (data) => {
            toast.success('Board updated successfully')
            if (data.slug !== boardSlug) {
                router.navigate({ to: '/admin/settings/boards/$boardSlug/general', params: { boardSlug: data.slug }, replace: true })
            }
        }
    })

    const form = useForm({
        defaultValues: {
            name: board?.name ?? '',
            description: board?.description ?? '',
            slug: boardSlug
        },
        validators: {
            onChange: schema,
        },
        onSubmit: async (data) => {
            updateBoard(data.value)
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    return (
        <div className='vertical gap-2'>
            <h1 className='text-gray-500 dark:text-zinc-400'>Naming</h1>
            <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
                <form.Field
                    name='name'
                    children={(field) => {
                        return (
                            <>
                                <Input
                                    label='Name'
                                    required
                                    placeholder='Feature Requests'
                                    className='w-full'
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldInfo field={field} />
                            </>
                        )
                    }}
                />
                <form.Field
                    name='description'
                    children={(field) => (
                        <>
                            <Input
                                label='Description'
                                placeholder='Provide a description for the board'
                                className='w-full'
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <FieldInfo field={field} />
                        </>
                    )}
                />
                <form.Field
                    name='slug'
                    children={(field) => (
                        <>
                            <Input
                                label='URL'
                                required
                                prefix={url}
                                className='w-full'
                                placeholder='feature-requests'
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <FieldInfo field={field} />
                        </>
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

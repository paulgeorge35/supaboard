import { FieldInfo } from '@/components'
import { Button } from '@/components/button'
import { FeedbackFormDemo } from '@/components/feedback-form-demo'
import { Input } from '@/components/input'
import { Switch } from '@/components/switch'
import { fetchClient } from '@/lib/client'
import { boardQuery } from '@/lib/query'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute(
    '/admin/settings/boards/$boardSlug/create-form',
)({
    component: RouteComponent,
})

function RouteComponent() {
    const { boardSlug } = useParams({ from: '/admin/settings/boards/$boardSlug/create-form' })
    const { data: board } = useQuery(boardQuery(boardSlug))

    const schema = z.object({
        callToAction: z.string({
            required_error: 'Call to action is required'
        }),
        title: z.string({
            required_error: 'Title field is required'
        }),
        details: z.string({
            required_error: 'Details field is required'
        }),
        detailsRequired: z.boolean(),
        buttonText: z.string({
            required_error: 'Button field is required'
        }),
    })

    const { mutate: updateBoard, isPending } = useMutation({
        mutationFn: (data: z.infer<typeof schema>) => fetchClient(`board/${boardSlug}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        onSuccess: () => {
            toast.success('Feedback form updated successfully');
            form.reset();
        }
    })

    const form = useForm({
        defaultValues: {
            callToAction: board?.callToAction ?? '',
            title: board?.title ?? '',
            details: board?.details ?? '',
            detailsRequired: board?.detailsRequired ?? false,
            buttonText: board?.buttonText ?? '',
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
            <h1 className='font-medium'>Create Feedback Form</h1>
            <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>Personalize your post creation form with additional details and instructions.</p>
            <hr className='my-2' />
            <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
                <p className='text-sm font-medium'>About</p>
                <form.Field
                    name='callToAction'
                    children={(field) => {
                        return (
                            <>
                                <Input
                                    label='Call to action'
                                    required
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
                    name='title'
                    children={(field) => (
                        <>
                            <Input
                                label='Title'
                                required
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
                    name='details'
                    children={(field) => (
                        <>
                            <Input
                                label='Details'
                                required
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
                    name='detailsRequired'
                    children={(field) => (
                        <>
                            <span className='horizontal space-between center-v w-full'>
                                <p className='text-sm font-light'>Make details field required</p>
                                <Switch
                                    name={field.name}
                                    checked={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.checked)}
                                />
                            </span>
                            <FieldInfo field={field} />
                        </>
                    )}
                />
                <form.Field
                    name='buttonText'
                    children={(field) => (
                        <>
                            <Input
                                label='Button'
                                required
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
                <p className='text-sm font-medium'>Preview</p>
                <form.Subscribe
                    selector={(state) => [state.values]}
                    children={([values]) => (
                        <FeedbackFormDemo
                            callToAction={values.callToAction}
                            title={values.title}
                            details={values.details}
                            buttonText={values.buttonText}
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

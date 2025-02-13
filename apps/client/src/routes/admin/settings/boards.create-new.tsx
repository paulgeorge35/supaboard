import { Button, FieldInfo, Input } from '@/components'
import { fetchClient } from '@/lib/client'
import { useAuthStore } from '@/stores/auth-store'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMemo } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/admin/settings/boards/create-new')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { application } = useAuthStore()

  const url = useMemo(() => {
    if (application?.customDomain && application.domainStatus === 'VERIFIED') {
      return `https://${application.customDomain}/`
    }

    return `https://${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}/`
  }, [application])

  const schema = z.object({
    name: z.string().min(3, {
      message: 'Name must be at least 3 characters long'
  }),
    description: z.string(),
    slug: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
      message: 'URL must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
    }),
  })

  const { mutate: createBoard, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient(`board`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onMutate: () => {
      // queryClient.cancelQueries({ queryKey: board })
    },
    onSuccess: (data) => {
      router.navigate({ to: '/admin/settings/boards/$boardSlug/general', params: { boardSlug: data.slug } })
    }
  })

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      slug: '',
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: async (data) => {
      createBoard(data.value)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  const nameToSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
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
                onBlur={() => {
                  if (!form.getFieldValue('slug') && field.state.value.trim().length > 0) {
                    form.setFieldValue('slug', nameToSlug(field.state.value));
                    form.validateField('slug', 'change')
                  }
                }}
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
            Create Board
          </Button>
        )}
      />
    </form>
  )
}

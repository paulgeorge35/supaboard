import { Button, Input } from '@/components';
import { fetchClient } from '@/lib/client';
import { useAuthStore } from '@/stores/auth-store';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams, useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/password-reset/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { token } = useParams({ from: '/password-reset/$token' });

  const { error } = useQuery({
    queryKey: ['auth', 'password-reset', token],
    queryFn: () => fetchClient(`/auth/password/verify-reset`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
    retry: false,
  });

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: (data: { password: string, token: string }) => fetchClient(`/auth/password/reset`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast.success('Password reset successfully');
      router.navigate({ to: '/' });
    },
  });

  const schema = z.object({
    password: z.string({
      required_error: 'Password is required',
    }).min(8, {
      message: 'Password must be at least 8 characters long',
    }).regex(/[A-Z]/, {
      message: 'Password must contain at least one uppercase letter',
    }).regex(/[0-9]/, {
      message: 'Password must contain at least one number',
    }).regex(/[^A-Za-z0-9]/, {
      message: 'Password must contain at least one special character',
    }),
    confirmPassword: z.string({
      required_error: 'Confirm password is required',
    }).min(8, {
      message: 'Confirm password must be at least 8 characters long',
    }).regex(/[A-Z]/, {
      message: 'Confirm password must contain at least one uppercase letter',
    }).regex(/[0-9]/, {
      message: 'Confirm password must contain at least one number',
    }).regex(/[^A-Za-z0-9]/, {
      message: 'Confirm password must contain at least one special character',
    }),
  }).superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
      });
    }
  });

  const form = useForm<z.infer<typeof schema>>({
    validators: {
      onSubmit: schema,
    },
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    onSubmit: (data) => {
      resetPassword({
        password: data.value.password,
        token,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  // if (user || error) {
  //   return <Navigate to="/" />
  // }

  return (
    <div className='vertical center gap-2 h-[100dvh] overflow-y-auto'>
      <div className='w-full vertical gap-4 max-w-md p-4 rounded-lg border bg-white dark:bg-zinc-900'>
        <span className='vertical'>
          <h1 className='text-2xl font-bold'>Reset Password</h1>
          <p className='text-sm text-gray-500 dark:text-zinc-400'>Enter your new password below.</p>
        </span>
        <form onSubmit={handleSubmit} className='vertical gap-4'>
          <form.Field
            name='password'
            children={(field) => {
              return (
                <Input type='password'
                  label='Password'
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  showStrength
                  field={field}
                />
              )
            }}
          />
          <form.Field
            name='confirmPassword'
            children={(field) => {
              return <Input type='password'
                label='Confirm Password'
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                field={field}
              />
            }}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
            children={([canSubmit, isSubmitting, isDirty]) => (
              <Button type='submit' variant='outline' color='secondary' isLoading={isSubmitting || isPending} disabled={!canSubmit || !isDirty}>
                Reset Password
              </Button>
            )}
          />
        </form>
      </div>
    </div>
  )
}

import { Button } from '@/components/button';
import { Switch } from '@/components/switch';
import { fetchClient } from '@/lib/client';
import { applicationQuery } from '@/lib/query/application';
import { cn } from '@/lib/utils';
import { Application } from '@repo/database';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/changelog/privacy')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient();

  const { data: application } = useQuery(applicationQuery);

  const schema = z.object({
    isChangelogPublic: z.boolean(),
    isChangelogSubscribable: z.boolean(),
  });

  const form = useForm<z.infer<typeof schema>>({
    validators: {
      onSubmit: schema,
    },
    defaultValues: {
      isChangelogPublic: application?.isChangelogPublic ?? false,
      isChangelogSubscribable: application?.isChangelogSubscribable ?? false,
    },
    onSubmit: (data) => {
      updateApplication(data.value);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  const { mutate: updateApplication, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient('application', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onMutate: (data) => {
      queryClient.cancelQueries(applicationQuery);

      const previousApplication = queryClient.getQueryData<Application>(applicationQuery.queryKey);

      queryClient.setQueryData(applicationQuery.queryKey, (old: Application | undefined) => {
        if (!old) return undefined;
        return {
          ...old,
          ...data
        }
      })

      return { previousApplication };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
    },
    onSettled: () => {
      queryClient.invalidateQueries(applicationQuery);
    },
    onSuccess: () => {
      toast.success('Changelog privacy updated');
      form.reset();
    },
  });

  return (
    <form onSubmit={handleSubmit} className='vertical gap-4 items-start'>
      <form.Field
        name='isChangelogPublic'
        children={(field) => (
          <span className='grid grid-cols-2 gap-1 bg-gray-100 dark:bg-zinc-800 rounded-md p-2'>
            <div
              role='button'
              onClick={() => field.handleChange(true)}
              className={cn('vertical center gap-2 rounded-md p-2 border-2 border-transparent cursor-pointer transition-colors',
                { 'border-[var(--color-primary)] bg-white dark:bg-zinc-900': field.state.value },
                { 'hover:border-gray-300 dark:hover:border-zinc-700': !field.state.value }
              )}>
              <h1 className='text-lg font-bold text-center'>Public</h1>
              <p className='text-sm font-light text-balance text-center mx-8 text-gray-500 dark:text-zinc-400'>
                Anybody can access your changelog.
              </p>
            </div>
            <div
              role='button'
              onClick={() => field.handleChange(false)}
              className={cn('vertical center gap-2 rounded-md p-2 border-2 border-transparent cursor-pointer transition-colors',
                { 'border-[var(--color-primary)] bg-white dark:bg-zinc-900': !field.state.value },
                { 'hover:border-gray-300 dark:hover:border-zinc-700': field.state.value }
              )}>
              <h1 className='text-lg font-bold text-center'>Private</h1>
              <p className='text-sm font-light text-balance text-center mx-8 text-gray-500 dark:text-zinc-400'>
                Only you can access your changelog.
              </p>
            </div>
          </span>
        )}
      />
      <form.Field
        name='isChangelogSubscribable'
        children={(field) => (
          <span className='grid grid-cols-[1fr_auto] gap-2 w-full'>
            <span className='vertical gap-1'>
              <h1 className='text-sm font-bold'>Email subscriptions</h1>
              <p className='text-sm font-light text-balance text-gray-500 dark:text-zinc-400'>
                Allow users to subscribe to your changelog via email.
              </p>
            </span>
            <div className='vertical center-v gap-1'>
              <Switch
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
            </div>
          </span>
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
  )
}

import { Button, RadioGroup } from '@/components';
import { fetchClient } from '@/lib/client';
import { applicationQuery } from '@/lib/query';
import { Application } from '@repo/database';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';
export const Route = createFileRoute('/admin/settings/company/preferences')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: application } = useQuery(applicationQuery);

  const schema = z.object({
    preferredLanguage: z.enum(['EN', 'RO']).optional(),
  });

  const form = useForm({
    defaultValues: {
      preferredLanguage: application?.preferredLanguage ?? 'EN',
    },
    validators: {
      onSubmit: schema,
    },
    onSubmit: (data) => {
      updateApplication(data.value);
    },
  });

  const { mutate: updateApplication, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient('application', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onMutate: (data) => {
      queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

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
      queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
    },
    onSuccess: () => {
      toast.success('Application language updated successfully');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }


  return (
    <div className='vertical gap-2'>
      <h1 className='text-sm font-medium'>Language preferences</h1>
      <p className='text-sm font-light text-gray-500 dark:text-zinc-400'>
        Set the language your users will be presented with.
      </p>
      <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
        <form.Field
          name='preferredLanguage'
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

import { FieldInfo, Input } from '@/components';
import { ModalComponent } from '@/components/modal-component';
import { SelectComponent } from '@/components/select';
import { useCreateFeedbackMutation } from '@/lib/mutation';
import { applicationBoardsQuery } from '@/lib/query';
import { useForm } from '@tanstack/react-form';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi, useParams, useRouter, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button, TextArea } from 'react-aria-components';
import { z } from 'zod';
import { categoriesQuery } from '../settings/boards.$boardSlug.categories';

export const Route = createFileRoute('/admin/roadmap/$roadmapSlug/new')({
  context: () => {
    const queryClient = new QueryClient();
    return {
      queryClient,
    }
  },
  loader: async ({ context }) => await context.queryClient.ensureQueryData(applicationBoardsQuery),
  component: RouteComponent,
})

function RouteComponent() {
  const routeApi = getRouteApi(Route.fullPath);
  const boards = routeApi.useLoaderData();
  const router = useRouter();
  const search = useSearch({ from: Route.fullPath });
  const [board, setBoard] = useState<string | undefined>(undefined);
  const { roadmapSlug } = useParams({ from: Route.fullPath })
  const { mutate: createFeedback } = useCreateFeedbackMutation(roadmapSlug);

  const onClose = () => {
    router.navigate({ to: '/admin/roadmap/$roadmapSlug', params: { roadmapSlug }, search });
  }

  const schema = z.object({
    title: z.string().min(1).trim(),
    description: z.string().optional(),
    board: z.string().min(1).trim(),
    categoryId: z.string().optional(),
  })

  const form = useForm({
    validators: {
      onChange: schema,
    },
    onSubmit: async (data) => {
      createFeedback(data.value);
    }
  })

  const { data: categories, refetch } = useQuery(categoriesQuery(board!));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  useEffect(() => {
    if (board) {
      refetch();
    }
  }, [board]);

  return (
    <ModalComponent
      isOpen={true}
      onClose={onClose}
      aria-label="Create Feedback"
    >
      <form onSubmit={handleSubmit} className='vertical gap-2 items-start'>
        <h1 className='text-lg pb-2 font-bold'>Create feedback</h1>
        <form.Field
          name='board'
          children={(field) => (
            <>
              <SelectComponent
                required
                placeholder='Select board...'
                className='w-full'
                triggerClassName='w-full h-9'
                value={field.state.value}
                onChange={(value) => {
                  if (value) {
                    field.handleChange(value as string);
                    setBoard(boards?.find((board) => board.id === value)?.slug);
                  }
                }}
                options={boards?.map((board) => ({ label: board.name, value: board.id })) ?? []}
              />
              <FieldInfo field={field} />
            </>
          )}
        />
        {categories && categories.filter((category) => category.name !== 'Uncategorized').length > 0 && <form.Field
          name='categoryId'
          children={(field) => (
            <>
              <SelectComponent
                label='Category'
                placeholder='Select category...'
                className='w-full'
                triggerClassName='w-full h-9'
                value={field.state.value}
                disabled={!form.state.values.board}
                onChange={(value) => value ? field.handleChange(value as string) : undefined}
                options={categories?.filter((category) => category.name !== 'Uncategorized').map((category) => ({ label: category.name, value: category.id })) ?? []}
              />
              <FieldInfo field={field} />
            </>
          )}
        />}
        <form.Field
          name='title'
          children={(field) => (
            <>
              <Input
                required
                label='Title'
                placeholder='Enter title...'
                className='w-full'
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldInfo field={field} />
            </>
          )}
        />
        <form.Field
          name='description'
          children={(field) => (
            <>
              <TextArea
                placeholder='Enter description...'
                className='w-full border rounded-md px-3 py-2 md:text-sm focus:outline-none resize-none text-zinc-800 dark:text-zinc-300'
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
                value={field.state.value ?? ''}
                onChange={(e) => field.handleChange(e.target.value)}
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
          <Button
            type='submit'
            className='rounded-md text-sm px-2 py-1 bg-[var(--color-primary)] text-zinc-100 hover:bg-[var(--color-primary)]/80 transition-colors duration-100 font-light disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Submit
          </Button>
        </div>
      </form>
    </ModalComponent>
  )
}

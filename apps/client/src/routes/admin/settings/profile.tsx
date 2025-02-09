import { Avatar, Button, FieldInfo, Input } from '@/components';
import { fetchClient } from '@/lib/client';
import { meQuery, MeQueryData } from '@/routes/__root';
import { useAuthStore } from '@/stores/auth-store';
import { User } from '@repo/database';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(user?.avatar ?? undefined);
  const [file, setFile] = useState<{
    file: File;
    key: string;
  } | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = z.object({
    avatar: z.string().optional(),
    name: z.string(),
    email: z.string().email(),
  })

  const { mutate: updateUser, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient('/auth/update', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onMutate: (data) => {
      queryClient.cancelQueries({ queryKey: meQuery.queryKey });

      const previousUser = queryClient.getQueryData<MeQueryData>(meQuery.queryKey);

      queryClient.setQueryData<MeQueryData>(meQuery.queryKey, (old) => {
        if (!old) return undefined;
        return {
          ...old,
          user: {
            ...(old.user as User),
            ...data
          }
        }
      });

      return { previousUser };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(meQuery.queryKey, context?.previousUser);
    },
    onSuccess: () => {
      toast.success('User updated successfully')
    }
  })

  const form = useForm({
    defaultValues: {
      avatar: user?.avatar ?? undefined,
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async (data) => {
      upload()
      updateUser({
        ...data.value,
        avatar: file?.key,
      })
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  const uploadFile = async (url: string, file?: File, key?: string) => {
    if (!file || !key) return;
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
    })

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return key;
  }

  const { data: uploadedFile } = useQuery<{ url: string }>({
    queryKey: ['storage', user?.avatar, 'read'],
    queryFn: async () => await fetchClient(`storage/${user?.avatar}/read`, {
      method: 'GET',
    }),
    enabled: !!user?.avatar && user.avatar.startsWith('avatar/')
  })

  const { mutate: upload } = useMutation({
    mutationFn: async () => await fetchClient(`storage/${file?.key}/write`, {
      method: 'PUT',
    }),
    onSuccess: (data) => {
      uploadFile(data.url, file?.file, file?.key);
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile({
        file,
        key: `avatar/${uuidv4()}`,
      });
      setPreviewUrl(
        URL.createObjectURL(file)
      );
    }
  }

  return (
    <div>
      <div className='p-8 gap-2 vertical border-b'>
        <h1 className='text-2xl'>Profile</h1>
        <p className='text-sm text-gray-500 dark:text-zinc-400'>
          Manage your profile information
        </p>
      </div>
      <form onSubmit={handleSubmit} className='p-8 vertical items-start gap-4 md:max-w-2xl'>
        <span className='horizontal center-v gap-4'>
          <Avatar
            src={uploadedFile?.url ?? previewUrl}
            name={user?.name ?? "User"}
            className='size-20 text-3xl'
          />
          <input ref={fileInputRef} accept='image/*' type='file' className='sr-only' onChange={handleFileChange} />
          <Button
            role='button'
            color='secondary'
            variant='outline'
            size='md'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click()
            }}
          >
            Upload image
          </Button>
        </span>

        <form.Field
          name='name'
          children={(field) => (
            <>
              <Input
                label='Name'
                required
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className='w-full'
              />
              <FieldInfo field={field} />
            </>
          )}
        />
        <form.Field
          name='email'
          children={(field) => (
            <>
              <Input
                label='Email'
                required
                disabled
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className='w-full'
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

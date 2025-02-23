import { Avatar, Button, FormError, Icons, Input } from '@/components';
import { SelectComponent } from '@/components/select';
import { fetchClient } from '@/lib/client';
import { applicationInvitesQuery, membersQuery } from '@/lib/query';
import { ROLE_OPTIONS } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { ApplicationInviteSummary, MemberSummary, Role } from '@repo/database';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/admins/people')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: members } = useQuery(membersQuery);
  const { data: invites } = useQuery(applicationInvitesQuery);

  const schema = z.object({
    emails: z.string().transform((val) => val.trim().split(/[,\s]+/).map(email => email.trim())),
    role: z.enum(['ADMIN', 'COLLABORATOR'], {
      message: 'Role is required',
    })
  }).superRefine((data, ctx) => {
    const invalidEmail = data.emails.find(email => !z.string().email().safeParse(email).success);
    if (invalidEmail !== undefined) {
      ctx.addIssue({
        path: ['emails'],
        message: `"${invalidEmail}" is not a valid email address`,
        code: 'custom',
      });
    }
    return true;
  });

  const { mutate: inviteUsers } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient('admin/users/invites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onMutate: (data) => {
      queryClient.cancelQueries(applicationInvitesQuery);

      const previousInvites = queryClient.getQueryData(applicationInvitesQuery.queryKey);

      queryClient.setQueryData(applicationInvitesQuery.queryKey, (old: ApplicationInviteSummary[] | undefined) => {
        if (!old) return undefined;
        return [...old, ...data.emails.map(email => ({
          id: uuidv4(),
          email,
          role: data.role as Role,
        }))];
      });

      return { previousInvites };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(applicationInvitesQuery.queryKey, context?.previousInvites);
    },
    onSettled: () => {
      queryClient.invalidateQueries(applicationInvitesQuery);
    }
  });

  const form = useForm({
    validators: {
      onSubmit: schema,
    },
    onSubmit: (data) => {
      inviteUsers(schema.parse(data.value));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }

  return (
    <div className='vertical gap-4'>
      <h1 className='text-sm font-medium'>Manage admins</h1>

      <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
        <form.Field
          name='emails'
          children={(field) => (
            <>
              <Input
                type='textarea'
                value={field.state.value ?? ''}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  field.validate('change');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    form.handleSubmit();
                  }
                }}
                placeholder='Email addresses, separated by commas or spaces'
                className='w-full'
              />
            </>
          )}
        />
        <span className='horizontal ml-auto gap-2'>
          <form.Field
            name='role'
            children={(field) => (
              <SelectComponent
                placeholder='Select role...'
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(value as 'ADMIN' | 'COLLABORATOR');
                }}
                options={[
                  { label: 'Admin', value: 'ADMIN' },
                  { label: 'Contributor', value: 'COLLABORATOR' },
                ]}
                className='w-32'
              />
            )}
          />
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty, state.isValid]}
            children={([canSubmit, isSubmitting, isDirty, isValid]) => (
              <Button type='submit' color='secondary' isLoading={isSubmitting} disabled={!canSubmit || !isDirty || !isValid}>
                Send invites
              </Button>
            )}
          />
        </span>

        <form.Subscribe
          selector={(state) => [state.errors]}
          children={(errors) => (
            <FormError errors={errors[0]} />
          )}
        />

      </form>

      <div className='vertical gap-2'>
        <h2 className='text-sm font-medium'>Members</h2>
        {members?.map(member => (
          <MemberRow key={member.user.id} member={member} />
        ))}
      </div>

      <br />

      {invites && invites.length > 0 && (
        <div className='vertical gap-2'>
          <h2 className='text-sm font-medium'>Invites</h2>
          {invites?.map(invite => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  )
}

const MemberRow = ({ member }: { member: MemberSummary }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { mutate: deleteMember } = useMutation({
    mutationFn: (id: string) => fetchClient(`admin/users/${id}`, {
      method: 'DELETE',
    }),
    onMutate: (data) => {
      queryClient.cancelQueries(membersQuery);

      const previousMembers = queryClient.getQueryData(membersQuery.queryKey);
      
      queryClient.setQueryData(membersQuery.queryKey, (old: MemberSummary[] | undefined) => {
        if (!old) return undefined;
        return old.filter(member => member.user.id !== data);
      });

      return { previousMembers };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(membersQuery.queryKey, context?.previousMembers);
    },
    onSettled: () => {
      queryClient.invalidateQueries(membersQuery);
    },
    onSuccess: () => {
      toast.success('Member deleted');
    }
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: (data: { id: string, role: Role }) => fetchClient(`admin/users/${data.id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onMutate: (data) => {
      queryClient.cancelQueries(membersQuery);

      const previousMembers = queryClient.getQueryData(membersQuery.queryKey);
      
      queryClient.setQueryData(membersQuery.queryKey, (old: MemberSummary[] | undefined) => {
        if (!old) return undefined;
        return old.map(member => member.user.id === data.id ? { ...member, role: data.role } : member);
      });

      return { previousMembers };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(membersQuery.queryKey, context?.previousMembers);
    },
    onSettled: () => {
      queryClient.invalidateQueries(membersQuery);
    },
    onSuccess: () => {
      toast.success('Role updated');
    }
  });

  return (
    <div className='horizontal center-v gap-2 w-full'>
      <Avatar src={member.user.avatar ?? undefined} name={member.user.name} />
      <span className='vertical gap-1'>
        <span className='font-medium text-sm'>{member.user.name}</span>
        <span className='text-xs text-gray-500'>{member.user.email}</span>
      </span>
      <SelectComponent
        value={member.role}
        disabled={member.user.id === user?.id}
        onChange={(value) => {
          updateRole({ id: member.user.id, role: value as Role });
        }}
        options={[
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Contributor', value: 'COLLABORATOR' },
        ]}
        className='ml-auto h-9 w-32'
      />
      <Button
        size='icon'
        disabled={member.user.id === user?.id}
        variant='ghost'
        className='[&>svg]:!stroke-red-500'
        onClick={() => deleteMember(member.user.id)}
      >
        <Icons.Trash2 className='size-4' />
      </Button>
    </div >
  )
}

const InviteRow = ({ invite }: { invite: ApplicationInviteSummary }) => {
  const queryClient = useQueryClient();

  const { mutate: deleteInvite } = useMutation({
    mutationFn: (id: string) => fetchClient(`admin/users/invites/${id}`, {
      method: 'DELETE',
    }),
    onMutate: (data) => {
      queryClient.cancelQueries(applicationInvitesQuery);

      const previousInvites = queryClient.getQueryData(applicationInvitesQuery.queryKey);

      queryClient.setQueryData(applicationInvitesQuery.queryKey, (old: ApplicationInviteSummary[] | undefined) => {
        if (!old) return undefined;
        return old.filter(invite => invite.id !== data);
      });

      return { previousInvites };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(applicationInvitesQuery.queryKey, context?.previousInvites);
    },
    onSettled: () => {
      queryClient.invalidateQueries(applicationInvitesQuery);
    }
  });

  return (
    <div className='horizontal center-v gap-2 w-full'>
      <Avatar src={undefined} name={invite.email} />
      <span className='vertical gap-1'>
        <span className='font-medium text-sm'>{invite.email}</span>
        <span className='text-xs text-gray-500'>{ROLE_OPTIONS.find(option => option.value === invite.role)?.label}</span>
      </span>
      <Button 
        size='icon'
        variant='ghost'
        className='[&>svg]:!stroke-red-500 ml-auto'
        onClick={() => deleteInvite(invite.id)}
      >
        <Icons.Trash2 className='size-4' />
      </Button>
    </div>
  )
}
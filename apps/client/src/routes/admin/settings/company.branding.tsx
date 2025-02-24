import { Button, Icons } from '@/components';
import { ImageFile } from '@/components/image-file';
import { Input } from '@/components/input';
import { Popover } from '@/components/popover';
import { fetchClient } from '@/lib/client';
import { applicationQuery, ApplicationQueryData } from '@/lib/query';
import { cn } from '@/lib/utils';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useLocation } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/company/branding')({
  component: RouteComponent,
})

const themes = [
  {
    label: 'Light',
    value: 'LIGHT',
  },
  {
    label: 'Dark',
    value: 'DARK',
  },
  {
    label: 'System preference',
    value: 'SYSTEM',
  },
]

function RouteComponent() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  const { data: application } = useQuery(applicationQuery);

  const schema = z.object({
    logo: z.string().nullable(),
    icon: z.string().nullable(),
    color: z.string(),
    name: z.string().min(3, { message: 'Name is required' }),
    subdomain: z.string().min(3, { message: 'Subdomain is required' }),
    preferredTheme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  });

  const { mutate: updateApplication, isPending } = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => fetchClient('application', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onMutate: (data) => {
      queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

      const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);

      if (data.subdomain === application?.subdomain) {
        queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => {
          if (!old) return undefined;
          return {
            ...old,
            ...data
          }
        })
      }

      return { previousApplication };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
    },
    onSettled: (data) => {
      if (data.subdomain === application?.subdomain) {
        queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
      }
    },
    onSuccess: (data) => {
      toast.success('Application updated successfully');
      const url = new URL(location.href, `https://${application?.url}`);

      if (application?.subdomain !== data.subdomain) {
        window.location.replace(url.toString());
      }
    },
  });

  const form = useForm({
    defaultValues: {
      color: application?.color ?? '',
      name: application?.name ?? '',
      subdomain: application?.subdomain ?? '',
      preferredTheme: application?.preferredTheme ?? 'SYSTEM',
      logo: application?.logo ?? null,
      icon: application?.icon ?? null,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async (data) => {
      updateApplication(data.value);
      form.reset();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit()
  }

  return (
    <div className='vertical gap-2'>
      <form onSubmit={handleSubmit} className='w-full items-start vertical gap-4'>
        <form.Field
          name='logo'
          children={(field) => (
            <span className='horizontal gap-2 center-v'>
              <input
                ref={logoInputRef}
                accept='image/*'
                type='file'
                name={field.name}
                className='sr-only'
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  setLogoFile(file);
                  field.handleChange(`logo/${uuidv4()}-${file.name}`);
                }}
              />
              {field.state.value &&
                <ImageFile
                  fileKey={field.state.value}
                  file={logoFile ?? undefined}
                  width={128}
                  height={128}
                  ratio={1}
                  className='size-24'
                  onRemove={() => {
                    if (field.state.value) {
                      field.handleChange(null);
                    }
                  }}
                />
              }
              <span className='flex flex-col md:flex-row gap-2 center-v'>
                <Button type='button' variant='outline' color='secondary' size='md' onClick={(e) => {
                  e.preventDefault();
                  logoInputRef.current?.click();
                }}>
                  Upload logo
                </Button>
                <span className='vertical gap-1'>
                  <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>Recommended size: 128x128px</p>
                  <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>Ratio: 1:1</p>
                </span>
              </span>
            </span>
          )}
        />
        <form.Field
          name='icon'
          children={(field) => (
            <span className='horizontal gap-2 center-v'>
              <input
                ref={iconInputRef}
                accept='image/*'
                type='file'
                name={field.name}
                className='sr-only'
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  setIconFile(file);
                  field.handleChange(`icon/${uuidv4()}-${file.name}`);
                }}
              />
              {field.state.value &&
                <ImageFile
                  fileKey={field.state.value}
                  file={iconFile ?? undefined}
                  width={48}
                  height={48}
                  ratio={1}
                  className='size-24 p-6'
                  onRemove={() => {
                    if (field.state.value) {
                      field.handleChange(null);
                    }
                  }}
                />
              }
              <span className='flex flex-col md:flex-row gap-2 center-v'>
                <Button type='button' variant='outline' color='secondary' size='md' onClick={(e) => {
                  e.preventDefault();
                  iconInputRef.current?.click();
                }}>
                  Upload icon
                </Button>
                <span className='vertical gap-1'>
                  <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>Recommended size: 48x48px</p>
                  <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>Ratio: 1:1</p>
                </span>
              </span>
            </span>
          )}
        />
        <form.Field
          name='name'
          children={(field) => (
            <Input
              required
              type='text'
              label='Name'
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className='w-full'
            />
          )}
        />
        <form.Field
          name='subdomain'
          children={(field) => (
            <Input
              required
              type='text'
              label='Subdomain'
              suffix={`.${import.meta.env.VITE_APP_DOMAIN}`}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className='w-full'
            />
          )}
        />
        <br />
        <p className='text-sm font-medium'>Theme</p>

        <form.Field
          name='preferredTheme'
          children={(field) => {
            const theme = themes.find((theme) => theme.value === field.state.value)
            return (
              <>
                <span className="horizontal center-v space-between w-full">
                  <span className="vertical gap-2">
                    <p className='text-xs font-medium'>Feedback portal theme</p>
                    <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>
                      Select an interface theme for your public feedback portal.
                    </p>
                  </span>
                  <Popover
                    id='board-selector'
                    triggerClassName='w-50'
                    trigger={
                      <div className='text-sm font-light rounded-md px-2 py-2 border horizontal gap-2 center-v w-50 hover:bg-gray-100 dark:hover:bg-zinc-800/20 transition-colors duration-150 cursor-pointer'>
                        {
                          theme?.value === 'SYSTEM' ? <Icons.Monitor className='size-3' /> : theme?.value === 'LIGHT' ? <Icons.Sun className='size-3' /> : <Icons.Moon className='size-3' />
                        }
                        {theme?.label}
                        <Icons.ChevronDown className='ml-auto size-3' />
                      </div>
                    }
                    content={
                      <div className='flex flex-col gap-1 w-50'>
                        {themes.map((theme) => (
                          <button
                            key={theme.value}
                            data-popover-close
                            onClick={() => field.handleChange(theme.value as 'LIGHT' | 'DARK' | 'SYSTEM')}
                            disabled={field.state.value === theme.value}
                            className='horizontal gap-2 center-v text-nowrap w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 transition-colors duration-150'
                          >
                            {theme.value === 'SYSTEM' ? <Icons.Monitor className='size-3' /> : theme.value === 'LIGHT' ? <Icons.Sun className='size-3' /> : <Icons.Moon className='size-3' />}
                            {theme.label}
                          </button>
                        ))}
                      </div>
                    }
                  />
                </span>
              </>
            )
          }}
        />
        <form.Field
          name='color'
          children={(field) => (
            <>
              <span className="horizontal center-v space-between w-full gap-4">
                <span className="vertical gap-2">
                  <p className='text-xs font-medium'>Brand color</p>
                  <p className='text-xs font-light text-gray-500 dark:text-zinc-400'>
                    Assign a brand color to your public feedback portal while ensuring accessibility with our contrast checker.
                  </p>
                </span>

                <Input
                  type='text'
                  name={field.name}
                  value={field.state.value}
                  className='min-w-30'
                  onChange={(e) => {
                    const value = e.target.value;
                    field.handleChange(value.startsWith('#') ? value : `#${value}`);
                  }}
                  addornmentRight={(
                    <div className='size-5 aspect-square rounded-md bg-gray-100 dark:bg-zinc-800/20 border'
                      style={{
                        backgroundColor: field.state.value
                      }}
                    />
                  )}
                />
              </span>
            </>
          )}
        />
        <form.Subscribe
          selector={(state) => [state.values.color]}
          children={([color]) => (
            <span className='grid grid-cols-2 w-full border' style={{
              '--color-primary': color
            } as React.CSSProperties}>
              {/* White Theme Preview */}
              <div className='bg-white dark:bg-white p-4 horizontal center-v gap-4'>
                <DemoVoteButton color={color} className='border-gray-200 dark:border-gray-200' />
                <span className='vertical gap-2 items-start'>
                  <p className='text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-primary)]'>This is a medium 14px text</p>
                  <p className='text-xs font-light text-[var(--color-primary)] dark:text-[var(--color-primary)]'>
                    This is a light 12px text
                  </p>
                  <button type='button' className='h-9 px-4 text-base bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white [&>svg]:stroke-white rounded-md horizontal gap-2 center-v'>
                    <Icons.Lightbulb className='size-5' />
                    This is a button
                  </button>
                </span>
              </div>
              {/* Dark Theme Preview */}
              <div className='bg-zinc-900 dark:bg-zinc-900 p-4 horizontal center-v gap-4'>
                <DemoVoteButton color={color} className='border-zinc-800 dark:border-zinc-800' />
                <span className='vertical gap-2 items-start'>
                  <p className='text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-primary)]'>This is a medium 14px text</p>
                  <p className='text-xs font-light text-[var(--color-primary)] dark:text-[var(--color-primary)]'>
                    This is a light 12px text
                  </p>
                  <button type='button' className='h-9 px-4 text-base bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-zinc-900 [&>svg]:stroke-zinc-900 rounded-md horizontal gap-2 center-v'>
                    <Icons.Lightbulb className='size-5' />
                    This is a button
                  </button>
                </span>
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
    </div>
  )
}


const DemoVoteButton = ({ className, color, votes = 7200 }: { className?: string, color?: string, votes?: number }) => {
  const numberFormatted = useMemo(() => {
    if (votes > 1000) {
      return `${(votes / 1000).toFixed(1)}k`;
    }
    return votes;
  }, [votes]);
  return (
    <button
      type='button'
      style={{
        '--color-primary': color
      } as React.CSSProperties}
      className={cn("border rounded-md px-2 py-1 transition-colors duration-200 group w-9 vertical center gap-1",
        `hover:border-[var(--color-primary)] [&>span]:text-[var(--color-primary)] [&>svg]:stroke-[var(--color-primary)] hover:bg-[var(--color-primary)]/30`,
        className
      )}
    >
      <Icons.ChevronUp className="size-3 group-hover:-translate-y-[2px] transition-transform duration-200" />
      <span className="text-xs">
        {numberFormatted}
      </span>
    </button>
  )
}
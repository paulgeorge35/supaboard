import { Button, Icons, LoadingSpinner, Skeleton } from '@/components';
import { Input } from '@/components/input';
import { RadioSolo } from '@/components/radio-solo';
import { fetchClient } from '@/lib/client';
import { applicationQuery, ApplicationQueryData } from '@/lib/query';
import { cn } from '@/lib/utils';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/custom-domains/')({
    component: RouteComponent,
})

const schema = z.object({
    domain: z.string()
        .min(1, "Domain is required")
        .regex(
            /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid domain (e.g. feedback.yourdomain.com)"
        )
        .transform(value => value.toLowerCase().trim())
});

function RouteComponent() {
    const queryClient = useQueryClient();
    const { data: application, isLoading } = useQuery(applicationQuery);

    const { mutate: addCustomDomain, isPending: isPendingVerification } = useMutation({
        mutationFn: async (domain: string) => await fetchClient('/application/add-custom-domain', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        }),
        onMutate: (data) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    domains: [...old.domains, {
                        id: '1',
                        domain: data,
                        custom: true,
                        primary: false,
                        verifiedAt: null,
                        failedAt: null,
                    }]
                }
            });

            return {
                previousApplication,
            }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
        },
        onSuccess: () => {
            toast.success('Domain added successfully');
            form.reset();
        },
    });

    const form = useForm<z.infer<typeof schema>>({
        validators: {
            onSubmit: schema,
        },
        defaultValues: {
            domain: '',
        },
        onSubmit: (data) => {
            addCustomDomain(data.value.domain);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    const { mutate: removeDomain } = useMutation({
        mutationFn: async (domainId: string) => await fetchClient(`/application/remove-domain/${domainId}`, {
            method: 'POST',
        }),
        onMutate: (domainId) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    domains: old.domains.filter(d => d.id !== domainId),
                }
            });

            return {
                previousApplication,
            }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
        },
        onSuccess: () => {
            toast.success('Domain removed successfully');
        },
    });

    const { mutate: retryVerification } = useMutation({
        mutationFn: async (domainId: string) => await fetchClient(`/application/retry-verification/${domainId}`, {
            method: 'POST',
        }),
        onMutate: (domainId) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    domains: old.domains.map(d => d.id === domainId ? { ...d, failedAt: null } : d),
                }
            });

            return {
                previousApplication,
            }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
        },
    });

    const { mutate: setPrimaryDomain } = useMutation({
        mutationFn: async (domainId: string) => await fetchClient(`/application/primary-domain/${domainId}`, {
            method: 'POST',
        }),
        onMutate: (domainId) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<ApplicationQueryData>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: ApplicationQueryData | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    domains: old.domains.map(d => d.id === domainId ? { ...d, primary: true } : { ...d, primary: false }),
                }
            });

            return {
                previousApplication,
            }
        },
        onError: (_, __, context) => {
            queryClient.setQueryData(applicationQuery.queryKey, context?.previousApplication);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: applicationQuery.queryKey });
        },
        onSuccess: () => {
            toast.success('Primary domain set successfully');
        },
    });

    const url = `${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}`;
    return (
        <div className='grow overflow-y-auto min-w-screen md:min-w-full'>
            <div className='p-8 gap-2 vertical border-b'>
                <h1 className='text-2xl'>Custom Domains</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Manage your workspace's custom domains
                </p>
            </div>
            <div className='p-8 gap-8 vertical max-w-3xl'>
                <span className='gap-2 vertical'>
                    <p className='font-light text-sm text-zinc-900 dark:text-zinc-100'>We've created <span className='font-mono font-bold'>{url}</span> for you. With custom domains, you can use your own domain name (e.g. feedback.yourdomain.com) to access your workspace instead. Just add the domain below and follow the instructions.</p>
                    <p className='font-light text-sm text-zinc-900 dark:text-zinc-100'>Set your primary domain to update the links we use in our product/emails.</p>
                </span>

                {isLoading ? (
                    <div className='gap-2 vertical'>
                        <Skeleton className='h-14 w-full rounded-md' />
                        <Skeleton className='h-14 w-full rounded-md' />
                        <Skeleton className='h-14 w-full rounded-md' />
                    </div>
                ) : (
                    <div className='gap-2 vertical'>
                        {application?.domains.map(domain => (
                            <div key={domain.id} className='border rounded-md p-4 grid grid-cols-[auto_1fr_auto] center-v gap-2'>
                                <span className='horizontal gap-2 center-v'>
                                    <RadioSolo
                                        name="primary-domain"
                                        value={domain.id}
                                        checked={domain.primary}
                                        onChange={() => setPrimaryDomain(domain.id)}
                                        disabled={!domain.verifiedAt || !!domain.failedAt}
                                    />
                                </span>
                                <span className={cn('text-xs md:text-sm font-mono font-bold inline-flex flex-wrap gap-2 items-center w-full', {
                                    "text-gray-500 dark:text-zinc-400": !domain.verifiedAt,
                                })}>
                                    <p className='py-0.5'>{domain.domain}</p>
                                    <Pending domain={domain} />
                                    <Failed domain={domain} />
                                    <Primary domain={domain} />
                                </span>
                                <span className={cn('hidden ml-auto w-full md:flex horizontal gap-2 center-v justify-end')}>
                                    {domain.failedAt && (
                                        <Button
                                            variant='outline'
                                            size='icon'
                                            className='size-7 shrink-0'
                                            color='secondary'
                                            onClick={() => retryVerification(domain.id)}
                                        >
                                            <Icons.RefreshCcw className='size-4 stroke-[var(--color-primary)]' />
                                        </Button>
                                    )}
                                    {domain.custom && (
                                        <Button
                                            variant='outline'
                                            size='icon'
                                            className='size-7 shrink-0'
                                            color='secondary'
                                            onClick={() => removeDomain(domain.id)}
                                        >
                                            <Icons.Trash className='size-4 !stroke-red-500' />
                                        </Button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className='vertical gap-4'>
                    <div className='border rounded-md p-4 font-light text-zinc-900 dark:text-zinc-100 text-sm inline-flex flex-wrap gap-2 center-v'>
                        <Icons.Info className='size-5 stroke-[var(--color-primary)]' /> Make sure you point to <span className='font-mono font-bold'>cname.supaboard.io</span> in your DNS settings.
                    </div>

                    <div className='border rounded-md p-4'>
                        <h3 className='font-medium mb-4'>DNS Configuration Steps:</h3>
                        <ol className='list-decimal pl-4 text-sm space-y-2 font-light text-zinc-900 dark:text-zinc-100'>
                            <li>Submit your custom domain below</li>
                            <li>Go to your domain provider's DNS settings</li>
                            <li>Add a new CNAME record with the following values:
                                <div className='mt-2 space-y-1'>
                                    <p><strong>Host/Name:</strong> Use the subdomain you want (e.g., "feedback" for feedback.yourdomain.com)</p>
                                    <p><strong>Value/Points to:</strong> cname.supaboard.io</p>
                                    <p><strong>TTL:</strong> Use default or 3600</p>
                                </div>
                            </li>
                            <li>Save your changes and wait for DNS propagation (can take up to 48 hours)</li>
                        </ol>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className=" gap-2 vertical items-start">
                    <form.Field
                        name='domain'
                        children={(field) => {
                            return (
                                <Input
                                    label='Custom Domain'
                                    placeholder='feedback.yourdomain.com'
                                    className='w-full'
                                    disabled={isLoading}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={() => {
                                        field.handleBlur()
                                    }}
                                    onChange={(e) => {
                                        field.handleChange(e.target.value)
                                    }}
                                    field={field}
                                />
                            )
                        }}
                    />
                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}
                        children={([canSubmit, isSubmitting, isDirty]) => (
                            <Button type='submit' color='primary' isLoading={isSubmitting || isPendingVerification} disabled={!canSubmit || !isDirty || isLoading}>
                                Submit
                            </Button>
                        )}
                    />
                </form>

            </div>
        </div>
    )
}

type PendingProps = {
    domain: {
        id: string;
        domain: string;
        custom: boolean;
        primary: boolean;
        verifiedAt: Date | null;
        failedAt: Date | null;
    }
}

const Pending = ({ domain }: PendingProps) => {
    if (domain.custom && !domain.verifiedAt && !domain.failedAt) {
        return (
            <span className='text-xs text-orange-500 border border-orange-500 px-1 py-0.5 rounded-md horizontal center-v gap-1 bg-orange-500/10'>Pending<LoadingSpinner className='size-3 stroke-orange-500' /></span>
        )
    }
}

type FailedProps = {
    domain: {
        id: string;
        domain: string;
        custom: boolean;
        primary: boolean;
        verifiedAt: Date | null;
        failedAt: Date | null;
    }
}

const Failed = ({ domain }: FailedProps) => {
    if (domain.custom && domain.failedAt) {
        return (
            <span className='text-xs text-red-500 border border-red-500 px-1 py-0.5 rounded-md bg-red-500/10'>Failed</span>
        )
    }
}

type PrimaryProps = {
    domain: {
        id: string;
        domain: string;
        custom: boolean;
        primary: boolean;
        verifiedAt: Date | null;
        failedAt: Date | null;
    }
}

const Primary = ({ domain }: PrimaryProps) => {
    if (domain.primary) {
        return (
            <span className='text-xs text-[var(--color-primary)] border border-[var(--color-primary)] px-1 py-0.5 rounded-md bg-[var(--color-primary)]/20'>Primary</span>
        )
    }
}
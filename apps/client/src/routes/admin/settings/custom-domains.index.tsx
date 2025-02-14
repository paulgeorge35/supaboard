import { Button, Icons } from '@/components';
import { Input } from '@/components/input';
import { Skeleton } from '@/components/skeleton';
import { fetchClient } from '@/lib/client';
import { applicationQuery } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

export const Route = createFileRoute('/admin/settings/custom-domains/')({
    component: RouteComponent,
})

const domainSchema = z.string()
    .min(1, "Domain is required")
    .regex(
        /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid domain (e.g. feedback.yourdomain.com)"
    )
    .transform(value => value.toLowerCase().trim());

function RouteComponent() {
    const queryClient = useQueryClient();
    const { data: application, isLoading } = useQuery(applicationQuery);
    const [domain, setDomain] = useState(application?.customDomain || '');

    const { mutate: verifyDomain } = useMutation({
        mutationFn: async (domain: string) => await fetchClient('/application/verify-domain', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        }),
        onMutate: (data) => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<any>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: any | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    customDomain: data,
                    domainStatus: 'VERIFIED',
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
            toast.success('Domain configured successfully');
        },
    });

    const { mutate: removeDomain } = useMutation({
        mutationFn: async (domain: string) => await fetchClient('/application/remove-domain', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        }),
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: applicationQuery.queryKey });

            const previousApplication = queryClient.getQueryData<any>(applicationQuery.queryKey);

            queryClient.setQueryData(applicationQuery.queryKey, (old: any | undefined) => {
                if (!old) return undefined;
                return {
                    ...old,
                    customDomain: null,
                    domainStatus: 'PENDING',
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

    useEffect(() => {
        setDomain(application?.customDomain || '');
    }, [application?.customDomain]);

    const url = `${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}`;
    return (
        <div className='min-w-screen md:min-w-full'>
            <div className='p-8 gap-2 vertical border-b'>
                <h1 className='text-2xl'>Custom Domains</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Manage your workspace's custom domains
                </p>
            </div>
            <div className='p-8 gap-8 vertical max-w-3xl'>
                <span className='gap-2 vertical'>
                    <p className='font-light text-sm text-zinc-900 dark:text-zinc-100'>We've created <span className='font-black'>{url}</span> for you. With custom domains, you can use your own domain name (e.g. feedback.yourdomain.com) to access your workspace instead. Just add the domain below and follow the instructions.</p>
                    <p className='font-light text-sm text-zinc-900 dark:text-zinc-100'>Set your primary domain to update the links we use in our product/emails.</p>
                </span>

                {isLoading ? (
                    <div className="gap-4 vertical w-full">
                        <Skeleton className="h-[72px] w-full rounded-md" />
                        <Skeleton className="h-[56px] w-full rounded-md" />
                        <Skeleton className="h-10 w-[120px] rounded-md" />
                    </div>
                ) : (
                    <>
                        <span className="w-full">
                            <Input
                                label='Custom Domain'
                                placeholder='feedback.yourdomain.com'
                                value={domain}
                                readOnly={application?.domainStatus === 'VERIFIED'}
                                onChange={(e) => setDomain(e.target.value)}
                            />
                        </span>

                        {application?.domainStatus !== 'VERIFIED' && (
                            <div className='vertical gap-4'>
                                <div className='border rounded-md p-4 font-light text-zinc-900 dark:text-zinc-100 text-sm horizontal gap-2 center-v'>
                                    <Icons.Info className='size-5 stroke-[var(--color-primary)]' /> Make sure you point to <span className='font-black'>cname.supaboard.io</span> in your DNS settings.
                                </div>

                                <div className='border rounded-md p-4'>
                                    <h3 className='font-medium mb-4'>DNS Configuration Steps:</h3>
                                    <ol className='list-decimal pl-4 text-sm space-y-2 font-light text-zinc-900 dark:text-zinc-100'>
                                        <li>Go to your domain provider's DNS settings</li>
                                        <li>Add a new CNAME record with the following values:
                                            <div className='mt-2 space-y-1'>
                                                <p><strong>Host/Name:</strong> Use the subdomain you want (e.g., "feedback" for feedback.yourdomain.com)</p>
                                                <p><strong>Value/Points to:</strong> cname.supaboard.io</p>
                                                <p><strong>TTL:</strong> Use default or 3600</p>
                                            </div>
                                        </li>
                                        <li>Save your changes and wait for DNS propagation (can take up to 48 hours)</li>
                                        <li>Click "Verify Domain" below once DNS is configured</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {application?.domainStatus !== 'VERIFIED' ? (
                            <Button
                                onClick={() => verifyDomain(domain)}
                                disabled={domain.length === 0 || !domainSchema.safeParse(domain).success}
                            >
                                Verify Domain
                            </Button>
                        ) : (
                            <Button
                                onClick={() => removeDomain(domain)}
                            >
                                Remove Domain
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

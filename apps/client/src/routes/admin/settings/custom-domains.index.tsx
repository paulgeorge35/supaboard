import { Button, Icons } from '@/components';
import { Input } from '@/components/input';
import { fetchClient } from '@/lib/client';
import { applicationQuery } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
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
    const { data: application } = useQuery(applicationQuery);
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
    });

    const url = `${application?.subdomain}.${import.meta.env.VITE_APP_DOMAIN}`;
    return (
        <div>
            <div className='p-8 gap-2 vertical border-b'>
                <h1 className='text-2xl'>Custom Domains</h1>
                <p className='text-sm text-gray-500 dark:text-zinc-400'>
                    Manage your workspace's custom domains
                </p>
            </div>
            <div className='p-8 gap-8 vertical max-w-3xl'>
                <span className='gap-2 vertical'>
                    <p className='font-light text-zinc-900 dark:text-zinc-100'>We've created {url} for you. With custom domains, you can use your own domain name (feedback.yourdomain.com) to access your workspace instead. Just add the domain below and follow the instructions.</p>
                    <p className='font-light text-zinc-900 dark:text-zinc-100'>Set your primary domain to update the links we use in our product/emails.</p>
                </span>

                <span className="w-full">
                    <Input
                        label='Domain'
                        placeholder='feedback.yourdomain.com'
                        value={domain}
                        readOnly={application?.domainStatus === 'VERIFIED'}
                        onChange={(e) => setDomain(e.target.value)}
                    />
                </span>

                {application?.domainStatus !== 'VERIFIED' && <div className='border rounded-md p-4 font-light text-zinc-900 dark:text-zinc-100 text-sm horizontal gap-2 center-v'>
                    <Icons.Info className='size-5 stroke-[var(--color-primary)]' /> Make sure you point to <span className='font-black'>cname.supaboard.io</span> in your DNS settings.
                </div>}

                {application?.domainStatus !== 'VERIFIED' && <Button
                    onClick={() => verifyDomain(domain)}
                    disabled={domain.length === 0 || !domainSchema.safeParse(domain).success}
                >
                    Verify Domain
                </Button>}
            </div>
        </div>
    )
}

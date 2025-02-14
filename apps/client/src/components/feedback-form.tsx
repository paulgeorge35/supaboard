import { fetchClient } from '@/lib/client';
import { boardDetailedQuery } from '@/lib/query';
import { categoriesQuery } from '@/routes/admin/settings/boards.$boardSlug.categories';
import { useAuthStore } from '@/stores/auth-store';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { FieldInfo } from './field-info';
import { SelectComponent } from './select';
import { Skeleton } from './skeleton';

export function FeedbackForm() {
    const { boardSlug } = useParams({ from: '/_public/$boardSlug/' })
    const { data: board, isLoading } = useQuery(boardDetailedQuery(boardSlug))
    const { user } = useAuthStore()
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(true);

    const { data: categories } = useQuery(categoriesQuery(boardSlug))

    const createFeedback = useMutation({
        mutationFn: async (data: z.infer<typeof schema>) => await fetchClient(`/feedback/${board?.id}/create`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: (data) => {
            toast.success('Feedback created successfully');
            navigate({
                to: '/$boardSlug/$feedbackSlug',
                params: {
                    boardSlug,
                    feedbackSlug: data.slug,
                }
            });
        },
    });

    const schema = z.object({
        title: z.string({
            required_error: 'Title is required'
        }).min(1, 'Title is required'),
        description: board?.detailsRequired ? z.string({
            required_error: 'Description is required'
        }).min(1, 'Description is required') : z.string().optional(),
        categoryId: z.string().optional(),
    });

    const form = useForm({
        validators: {
            onSubmit: schema,
        },
        onSubmit: async (data) => {
            await createFeedback.mutateAsync(data.value);
            form.reset();
            setIsExpanded(false);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit()
    }

    const handleCancel = () => {
        form.reset();
        setIsExpanded(false);
    };

    if (isLoading) {
        return (
            <div className="border rounded-lg overflow-hidden">
                <div className='p-4 vertical gap-2'>
                    <Skeleton className="h-6 w-full rounded" />
                    <div className='vertical gap-1'>
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-24 w-full rounded" />
                    </div>
                    <div className='vertical gap-1'>
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-8 w-1/2 rounded" />
                    </div>
                </div>
                <div className='border-t horizontal center-v justify-end gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800/20'>
                    <Skeleton className="h-9 w-20 rounded" />
                    <Skeleton className="h-9 w-20 rounded" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <p className='px-4 text-center py-4 vertical gap-2 border rounded-lg bg-gray-50 text-sm text-gray-500 dark:bg-zinc-800/20 dark:text-zinc-400'>
                Please login to add a feedback
            </p>
        )
    }

    if (!board) {
        return null;
    }

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="border rounded-lg overflow-hidden"
            animate={{ height: isExpanded ? "auto" : "60px" }}
            transition={{ duration: 0.2 }}
        >
            <div className='p-4 vertical gap-2'>
                <form.Field
                    name="title"
                    children={(field) => (
                        <>
                            <input
                                type="text"
                                placeholder={board.title ?? 'Short title for your feedback'}
                                className='w-full focus:outline-none'
                                value={field.state.value ?? ''}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onFocus={() => setIsExpanded(true)}
                            />
                            <FieldInfo field={field} />
                        </>
                    )}
                />

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className='text-sm font-medium'>Details</p>
                            <form.Field
                                name="description"
                                children={(field) => (
                                    <>
                                        <textarea
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    form.handleSubmit();
                                                }
                                            }}
                                            placeholder={board.details ?? 'Describe your feedback'}
                                            className='w-full md:text-sm focus:outline-none resize-none'
                                            value={field.state.value ?? ''}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        <FieldInfo field={field} />
                                    </>
                                )}
                            />
                            {categories && categories?.length > 1 && (
                                <>
                                    <p className='text-sm font-medium'>Category</p>
                                    <form.Field
                                        name="categoryId"
                                        children={(field) => (
                                            <SelectComponent
                                                className='h-8 justify-start mt-1 w-1/2'
                                                value={field.state.value}
                                                placeholder='Select a category'
                                                onChange={(value) => field.handleChange(value)}
                                                options={categories.map((category) => ({
                                                    label: category.name,
                                                    value: category.id,
                                                }))}
                                            />
                                        )}
                                    />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className='border-t horizontal center-v justify-end gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800/20'
                    >
                        <button
                            type="button"
                            className='button button-secondary'
                            disabled={createFeedback.isPending}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <button
                                    type="submit"
                                    className='button button-primary'
                                    disabled={!canSubmit || isSubmitting || createFeedback.isPending}
                                >
                                    {createFeedback.isPending ? 'Submitting...' : board.buttonText ?? 'Submit'}
                                </button>
                            )}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.form>
    );
}
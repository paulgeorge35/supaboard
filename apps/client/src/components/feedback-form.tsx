import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { fetchClient } from '../lib/client';

const feedbackSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
});

type FeedbackInput = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
    boardId?: string;
}

export function FeedbackForm({ boardId }: FeedbackFormProps) {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(true);
    const [formData, setFormData] = useState<FeedbackInput>({
        title: '',
        description: '',
    });
    const [errors, setErrors] = useState<Partial<FeedbackInput>>({});

    const createFeedback = useMutation({
        mutationFn: async (data: FeedbackInput) => await fetchClient(`/feedback/${boardId}/create`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        onSuccess: (data) => {
            toast.success('Feedback created successfully');
            navigate({
                to: '/$board/$feedback',
                params: {
                    board: boardId ?? "",
                    feedback: data.slug,
                }
            });
        },
    });

    const handleSubmit = async () => {
        try {
            const validatedData = feedbackSchema.parse(formData);
            setErrors({});
            await createFeedback.mutateAsync(validatedData);
            setFormData({ title: '', description: '' });
            setIsExpanded(false);
        } catch (err) {
            if (err instanceof z.ZodError) {
                const fieldErrors: Partial<FeedbackInput> = {};
                err.errors.forEach((error) => {
                    const field = error.path[0] as keyof FeedbackInput;
                    fieldErrors[field] = error.message;
                });
                setErrors(fieldErrors);
            }
        }
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '' });
        setErrors({});
        setIsExpanded(false);
    };

    return (
        <motion.div
            className="border rounded-lg overflow-hidden"
            animate={{ height: isExpanded ? "auto" : "60px" }}
            transition={{ duration: 0.2 }}
        >
            <div className='p-4 vertical gap-2'>
                <input
                    type="text"
                    placeholder='Short title for your feedback'
                    className='w-full focus:outline-none'
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    onFocus={() => setIsExpanded(true)}
                />
                {errors.title && (
                    <p className='text-red-500 text-xs'>{errors.title}</p>
                )}

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className='text-sm font-medium'>Details</p>
                            <textarea
                                placeholder='Describe your feedback'
                                className='w-full text-sm focus:outline-none'
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                            {errors.description && (
                                <p className='text-red-500 text-xs'>{errors.description}</p>
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
                        className='border-t horizontal center-v justify-end gap-2 px-4 py-2 bg-gray-50'
                    >
                        <button
                            className='text-xs p-2 border rounded-lg px-4'
                            disabled={createFeedback.isPending}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className='text-xs p-2 bg-gray-900 text-white rounded-lg px-4 disabled:bg-gray-400'
                            onClick={handleSubmit}
                            disabled={createFeedback.isPending}
                        >
                            {createFeedback.isPending ? 'Submitting...' : 'Submit'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
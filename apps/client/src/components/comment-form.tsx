import { fetchClient } from '@/lib/client';
import { FeedbackActivitiesQueryData } from '@/lib/query';
import { useAuthStore } from '@/stores/auth-store';
import { useBoolean } from '@paulgeorge35/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icons } from './icons';
import { ImageFile } from './image-file';

type CommentFormProps = {
    className?: string;
    boardSlug: string;
    feedbackSlug: string;
}

export const CommentForm = ({ className, boardSlug, feedbackSlug }: CommentFormProps) => {
    const queryClient = useQueryClient();
    const { user, application } = useAuthStore();
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<ImageFile[]>([]);
    const expanded = useBoolean(false);
    const ref = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate: comment, isPending } = useMutation({
        mutationFn: async (content: string) => await fetchClient(`feedback/${boardSlug}/${feedbackSlug}/comment`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                files: attachments,
            })
        }),
        onMutate: (content) => {
            queryClient.cancelQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });

            if (!user) return;

            const previousActivities = queryClient.getQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug]);

            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], (old) => {
                return {
                    ...old,
                    activities: [...(old?.activities ?? []), {
                        id: 'new',
                        author: {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                            isAdmin: user.id === application?.ownerId
                        },
                        edited: false,
                        likes: 0,
                        likedByMe: false,
                        files: attachments.map(attachment => attachment.key),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        public: true,
                        pinned: false,
                        type: 'FEEDBACK_COMMENT',
                        data: {
                            content
                        },
                        feedbackId: feedbackSlug,
                        authorId: user.id
                    }]
                }
            })

            return { previousActivities };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], context?.previousActivities);
        },
        onSuccess: () => {
            setContent('');
            setAttachments([]);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });
        }
    })

    const isCommentDisabled = isPending || content.trim() === '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node) && attachments.length === 0) {
                expanded.setFalse();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [attachments.length])

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        setAttachments([
            ...attachments,
            ...files.map(file => ({
                file,
                key: uuidv4(),
                name: file.name.split('.').slice(0, -1).join('.'),
                extension: file.name.split('.').pop() ?? '',
                contentType: file.type,
                size: file.size,
            }))
        ]);
    }

    const { mutate: removeFile } = useMutation({
        mutationFn: async (key: string) => await fetchClient(`storage/${key}`, {
            method: 'DELETE',
        }),
        onMutate: (key) => {
            setAttachments(attachments.filter(attachment => attachment.key !== key));
        },
    })

    return (
        <div ref={ref} className={cn('flex-1 border', className)}>
            <div className='p-2'>
                <input
                    type="text"
                    placeholder="Add a comment"
                    className='w-full focus:outline-none md:text-sm'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={expanded.setTrue}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCommentDisabled) {
                            comment(content);
                        }
                    }}
                />
                {attachments.length > 0 && <span className='horizontal gap-2 flex-wrap pt-4'>
                    {attachments.map(attachment => (
                        <ImageFile key={attachment.key} fileKey={attachment.key} file={attachment.file} onRemove={() => removeFile(attachment.key)} />
                    ))}
                </span>}
            </div>
            <div className={cn('p-2 border-t hidden horizontal gap-2 space-between bg-gray-50 dark:bg-zinc-800/20', {
                'flex': expanded.value
            })}>
                <input ref={fileInputRef} accept="image/*" name="files" type="file" className="sr-only" multiple onChange={handleFileChange} />
                <Button size='icon' variant='outline' onClick={() => fileInputRef.current?.click()}>
                    <Icons.Paperclip className="size-4 !stroke-gray-500" />
                </Button>
                <button
                    className='button button-primary'
                    onClick={() => comment(content)}
                    disabled={isCommentDisabled}
                >
                    {isPending ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    )
}
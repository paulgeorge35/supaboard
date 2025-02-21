import { fetchClient } from "@/lib/client";
import { FeedbackActivitiesQueryData } from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";
import { useBoolean } from "@paulgeorge35/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Avatar } from "../avatar";
import { Button } from "../button";
import { Icons } from "../icons";
import { ImageFile } from "../image-file";
import { Switch } from "../switch";

export function AdminComment() {
    const { user, application } = useAuthStore();
    const { boardSlug, feedbackSlug } = useParams({ from: '/admin/feedback/$boardSlug/$feedbackSlug' });
    const queryClient = useQueryClient();
    const expanded = useBoolean(false);
    const ref = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [commentForm, setCommentForm] = useState<{
        content: string;
        files: ImageFile[];
        public: boolean;
    }>({
        content: '',
        files: [],
        public: true,
    });

    const { mutate: comment, isPending } = useMutation({
        mutationFn: async (content: string) => await fetchClient(`feedback/${boardSlug}/${feedbackSlug}/comment`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                public: commentForm.public,
                files: commentForm.files,
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
                        files: commentForm.files.map(file => file.key),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        public: true,
                        pinned: false,
                        type: 'FEEDBACK_COMMENT',
                        data: {
                            content
                        },
                        mergedFromId: null,
                        feedbackId: feedbackSlug,
                        authorId: user.id,
                        threadId: null,
                        thread: null,
                        replies: [] as any,
                    }]
                }
            })

            return { previousActivities };
        },
        onError: (_, __, context) => {
            queryClient.setQueryData<FeedbackActivitiesQueryData>(['feedback', 'activities', boardSlug, feedbackSlug], context?.previousActivities);
        },
        onSuccess: () => {
            expanded.setFalse();
            setCommentForm({
                content: '',
                files: [],
                public: true,
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feedback', 'activities', boardSlug, feedbackSlug] });
        }
    })

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node) && commentForm.files.length === 0) {
                expanded.setFalse();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [commentForm.files.length])

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        setCommentForm({
            ...commentForm, files: files.map(file => ({
                file,
                key: uuidv4(),
                name: file.name.split('.').slice(0, -1).join('.'),
                extension: file.name.split('.').pop() ?? '',
                contentType: file.type,
                size: file.size,
            }))
        });
    }

    const { mutate: removeFile } = useMutation({
        mutationFn: async (key: string) => await fetchClient(`storage/${key}`, {
            method: 'DELETE',
        }),
        onMutate: (key) => {
            setCommentForm({ ...commentForm, files: commentForm.files.filter(file => file.key !== key) });
        },
    })

    return (
        <div ref={ref} className="mt-auto border-t p-4 grid grid-cols-[auto_1fr_auto] gap-4">
            <Avatar
                src={user?.avatar ?? undefined}
                name={user?.name ?? 'P'}
            />
            <input
                disabled={isPending}
                onFocus={expanded.setTrue}
                type="text"
                value={commentForm.content}
                onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isPending && commentForm.content.trim() !== '') {
                        comment(commentForm.content);
                    }
                }}
                className="grow focus:outline-none md:text-sm"
                placeholder={commentForm.public ? 'Add a comment' : 'Add a private comment'}
            />
            {expanded.value && (
                <>
                    <input ref={fileInputRef} accept="image/*" name="files" type="file" className="sr-only" multiple onChange={handleFileChange} />
                    <Button size='icon' variant='outline' onClick={() => fileInputRef.current?.click()}>
                        <Icons.Paperclip className="size-4 !stroke-gray-500" />
                    </Button>
                    <span className="col-start-2 col-span-full horizontal gap-2">
                        {commentForm.files.map(file => !!file.key && (
                            <ImageFile key={file.key} fileKey={file.key} file={file.file} onRemove={() => removeFile(file.key)} />
                        ))}
                    </span>
                    <span className="col-start-2 col-span-full grid grid-cols-subgrid">
                        <span className="horizontal space-between center-v col-span-full">
                            <Switch disabled={isPending} label="Public" checked={commentForm.public} onChange={(e) => setCommentForm({ ...commentForm, public: e.target.checked })} />
                            <button
                                disabled={isPending || commentForm.content.trim() === ''}
                                className="button button-primary"
                                onClick={() => comment(commentForm.content)}
                            >
                                {isPending ? 'Submitting...' : 'Submit'}
                            </button>
                        </span>
                    </span>
                </>
            )}
        </div>
    )
}
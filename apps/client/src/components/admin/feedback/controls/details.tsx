import { Avatar, Button, Checkbox } from "@/components";
import { Icons } from "@/components/icons";
import { ImageFile } from "@/components/image-file";
import { Popover } from "@/components/popover";
import { fetchClient } from "@/lib/client";
import { membersQuery } from "@/lib/query/application";
import { meQuery, MeQueryData } from "@/lib/query/auth";
import { feedbackActivitiesQuery, FeedbackActivitiesQueryData, FeedbackPage, feedbackQuery, FeedbackQueryData, feedbacksInfiniteQuery } from "@/lib/query/feedback";
import { cn, FeedbackStatusConfig } from "@/lib/utils";
import { Route as FeedbackRoute } from "@/routes/admin/feedback";
import { Route } from "@/routes/admin/feedback/$boardSlug/$feedbackSlug";
import { categoriesQuery } from "@/routes/admin/settings/boards.$boardSlug.categories";
import { useAuthStore } from "@/stores/auth-store";
import { UseBoolean, useBoolean } from "@paulgeorge35/hooks";
import { InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearch } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { ChangeEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

enum FeedbackStatus {
    OPEN = 'OPEN',
    UNDER_REVIEW = 'UNDER_REVIEW',
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED'
}

enum ActivityType {
    FEEDBACK_CREATE = 'FEEDBACK_CREATE',
    FEEDBACK_STATUS_CHANGE = 'FEEDBACK_STATUS_CHANGE',
    FEEDBACK_OWNER_CHANGE = 'FEEDBACK_OWNER_CHANGE',
    FEEDBACK_CATEGORY_CHANGE = 'FEEDBACK_CATEGORY_CHANGE',
    FEEDBACK_ESTIMATED_DELIVERY_CHANGE = 'FEEDBACK_ESTIMATED_DELIVERY_CHANGE'
}

type FeedbackUpdateData = {
    boardId?: string;
    status?: FeedbackStatus;
    categoryId?: string | null;
    ownerId?: string | null;
    estimatedDelivery?: Date | null;
    content?: string;
    files?: ImageFile[];
    publicEstimate?: boolean;
}

export function Details() {
    const queryClient = useQueryClient();
    const { user, application } = useAuthStore();
    const search = useSearch({ from: FeedbackRoute.fullPath });
    const router = useRouter();
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    });
    const [statusChange, setStatusChange] = useState<FeedbackStatus | undefined>(undefined);
    const estimateRef = useRef<HTMLDivElement>(null);
    const estimateOpen = useBoolean(false);
    
    const { mutate, isPending } = useMutation({
        mutationFn: async (data: FeedbackUpdateData) => fetchClient(`admin/feedback/${boardSlug}/${feedbackSlug}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        onMutate: (data) => {
            queryClient.cancelQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
            queryClient.cancelQueries({ queryKey: feedbacksInfiniteQuery(search).queryKey });
            queryClient.cancelQueries({ queryKey: meQuery.queryKey });
            queryClient.cancelQueries({ queryKey: feedbackActivitiesQuery(boardSlug, feedbackSlug).queryKey });

            const previousFeedback = queryClient.getQueryData(feedbackQuery(boardSlug, feedbackSlug).queryKey)
            const previousFeedbacks = queryClient.getQueryData(feedbacksInfiniteQuery(search).queryKey)
            const previousMe = queryClient.getQueryData(meQuery.queryKey)
            const previousActivities = queryClient.getQueryData<FeedbackActivitiesQueryData>(feedbackActivitiesQuery(boardSlug, feedbackSlug).queryKey)

            queryClient.setQueryData(
                feedbackQuery(boardSlug, feedbackSlug).queryKey,
                (old: FeedbackQueryData | undefined) => {
                    if (!old) return undefined;
                    return {
                        ...old,
                        ...data,
                        files: data.files?.map(file => file.key) ?? [],
                    }
                }
            )

            queryClient.setQueryData(
                feedbacksInfiniteQuery(search).queryKey,
                (old: InfiniteData<FeedbackPage> | undefined) => {
                    if (!old) return undefined;
                    return {
                        ...old,
                        pages: old.pages.map(page => ({
                            ...page,
                            feedbacks: page.feedbacks.map(feedback =>
                                feedback.slug === feedbackSlug ? { ...feedback, ...data } : feedback
                            )
                        }))
                    };
                }
            )

            queryClient.setQueryData(
                meQuery.queryKey,
                (old: MeQueryData | undefined) => {
                    if (!old) return undefined;
                    return {
                        ...old,
                        application: {
                            ...old.application,
                            boards: data.boardId && data.boardId !== old.application.boards.find(board => board.slug === boardSlug)?.id ? old.application.boards.map(board => {
                                if (board.slug === boardSlug) {
                                    return {
                                        ...board, _count: {
                                            feedbacks: board._count.feedbacks - 1
                                        }
                                    }
                                }
                                if (data.boardId === board.id) {
                                    return {
                                        ...board, _count: {
                                            feedbacks: board._count.feedbacks + 1
                                        }
                                    }
                                }
                                return board
                            }
                            ) : old.application.boards
                        }
                    }
                }
            )

            if (data.status) {
                queryClient.setQueryData(
                    feedbackActivitiesQuery(boardSlug, feedbackSlug).queryKey,
                    (old: FeedbackActivitiesQueryData | undefined) => {
                        if (!old) return undefined;
                        return {
                            ...old, activities: [
                                ...(old.activities ?? []), {
                                    id: 'new',
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    type: ActivityType.FEEDBACK_STATUS_CHANGE,
                                    edited: false,
                                    public: true,
                                    pinned: false,
                                    feedbackId: feedbackSlug,
                                    data: {
                                        to: data.status!,
                                        from: data.status!,
                                        content: data.content,
                                    },
                                    mergedFromId: null,
                                    likes: 0,
                                    likedByMe: false,
                                    files: data.files?.map(file => file.key) ?? [],
                                    authorId: user?.id ?? '',
                                    author: {
                                        id: user?.id ?? '',
                                        name: user?.name ?? '',
                                        avatar: user?.avatar ?? null,
                                        isAdmin: user?.id === application?.ownerId
                                    },
                                }]
                        };
                    }
                )
            }
            return { previousFeedback, previousFeedbacks, previousMe, previousActivities };
        },
        onError: (_, __, context) => {
            if (context?.previousFeedback) {
                queryClient.setQueryData(
                    feedbackQuery(boardSlug, feedbackSlug).queryKey,
                    context.previousFeedback,
                )
            }
            if (context?.previousFeedbacks) {
                queryClient.setQueryData(
                    feedbacksInfiniteQuery(search).queryKey,
                    context.previousFeedbacks,
                )
            }
            if (context?.previousMe) {
                queryClient.setQueryData(
                    meQuery.queryKey,
                    context.previousMe,
                )
            }
            if (context?.previousActivities) {
                queryClient.setQueryData(
                    feedbackActivitiesQuery(boardSlug, feedbackSlug).queryKey,
                    context.previousActivities,
                )
            }
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({ queryKey: feedbackQuery(boardSlug, feedbackSlug).queryKey });
            queryClient.invalidateQueries({ queryKey: feedbacksInfiniteQuery(search).queryKey });
            queryClient.invalidateQueries({ queryKey: meQuery.queryKey });
            queryClient.invalidateQueries({ queryKey: feedbackActivitiesQuery(boardSlug, feedbackSlug).queryKey });
            router.navigate({ to: '/admin/feedback/$boardSlug/$feedbackSlug', params: { boardSlug: data.board.slug, feedbackSlug: data.slug }, search, replace: true });
        },
        onSuccess: () => {
            console.log('success')
            setStatusChange(undefined);
            estimateOpen.setFalse();
        }
    })

    return (
        <div className="grid grid-cols-[auto_1fr] gap-1 max-w-full">
            <h1 className="text-sm font-medium col-span-full">Details</h1>
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Public link</p>
            <LinkComponent />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Board</p>
            <BoardComponent isPending={isPending} updateData={mutate} />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Status</p>
            <StatusComponent isPending={isPending} updateData={mutate} statusChange={statusChange} setStatusChange={setStatusChange} />
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Owner</p>
            <OwnerComponent isPending={isPending} updateData={mutate} />
            <div ref={estimateRef} className="col-span-full grid grid-cols-subgrid">
                <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Estimated</p>
                <EstimatedDeliveryComponent isPending={isPending} updateData={mutate} feedbackSlug={feedbackSlug} boardSlug={boardSlug} ref={estimateRef} open={estimateOpen} />
            </div>
            <p className="text-gray-500 dark:text-zinc-300 text-sm font-light col-start-1 horizontal center-v py-1">Category</p>
            <CategoryComponent boardSlug={boardSlug} feedbackSlug={feedbackSlug} isPending={isPending} updateData={mutate} />
        </div>
    )
}

const LinkComponent = () => {
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })

    return (
        <span className="horizontal gap-1 min-w-0 group relative">
            <a
                href={`${window.location.origin}/${boardSlug}/${feedbackSlug}`}
                className="pl-2 py-1 text-sm font-light underline truncate min-w-0"
            >
                {`${window.location.origin}/${boardSlug}/${feedbackSlug}`}
            </a>
            <button
                className="absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 hidden group-hover:flex size-7 m-0 border rounded-md p-1 horizontal center [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-700/50 transition-colors duration-150 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${boardSlug}/${feedbackSlug}`)}
            >
                <Icons.Copy className="size-4" />
            </button>
            <div className="hidden w-8 flex-shrink-0 group-hover:block h-1" />
        </span>
    )
}

const BoardComponent = ({ isPending, updateData }: { isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { application } = useAuthStore();
    const { boardSlug } = useParams({
        from: Route.fullPath,
    })

    if (!application?.boards) return null;

    const board = application.boards.find(board => board.slug === boardSlug);

    return (
        <Popover
            id="board-dropdown"
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                    "horizontal center-v min-w-0 group relative px-2 py-1"
                )}>
                    <span className="truncate min-w-0">{board?.name}</span>
                    <Icons.ChevronDown className="size-3" />
                </div>
            }
            content={
                <div className="flex flex-col gap-1">
                    {application.boards.map(board => (
                        <button
                            key={board.id}
                            data-popover-close
                            disabled={isPending || board.slug === boardSlug}
                            className={cn('block text-nowrap w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50', {
                                'bg-gray-100 dark:bg-zinc-800/20': board.slug === boardSlug
                            })}
                            onClick={() => updateData({ boardId: board.id })}>
                            {board.name}
                        </button>
                    ))}
                </div>
            }
        />
    )
}

type StatusComponentProps = {
    isPending: boolean;
    updateData: (data: FeedbackUpdateData) => void;
    statusChange: FeedbackStatus | undefined;
    setStatusChange: (statusChange: FeedbackStatus | undefined) => void;
}

const StatusComponent = ({ isPending, updateData, statusChange, setStatusChange }: StatusComponentProps) => {
    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));

    if (!feedback) return null;

    const status = FeedbackStatusConfig[feedback.status];

    const newStatus = statusChange ? FeedbackStatusConfig[statusChange] : undefined;

    return (
        <>
            <Popover
                id="status-dropdown"
                trigger={
                    <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                        "horizontal center-v min-w-0 group relative px-2 py-1"
                    )}>
                        <span className="truncate">{newStatus?.label ?? status.label}</span>
                        <Icons.ChevronDown className="size-3" />
                    </div>
                }
                content={
                    <div className="flex flex-col gap-1">
                        {Object.entries(FeedbackStatusConfig).map(([key, value]) => {
                            const colorClass = `${value.text} dark:${value.text}`;
                            return (
                                <button
                                    key={key}
                                    data-popover-close
                                    disabled={isPending || key === feedback.status}
                                    className={cn(
                                        'block text-xs font-medium uppercase text-nowrap w-full text-left px-4 py-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-zinc-800/20',
                                        colorClass
                                    )}
                                    onClick={() => setStatusChange(key as FeedbackStatus)}
                                >
                                    {value.label}
                                </button>
                            )
                        })}
                    </div >
                }
            />
            {statusChange && <CommentForm updateData={updateData} isPending={isPending} statusChange={statusChange} />}
        </>
    )
}

type CommentFormProps = {
    statusChange: FeedbackStatus;
    className?: string;
    updateData: (data: FeedbackUpdateData) => void;
    isPending: boolean;
}

export const CommentForm = ({ className, statusChange, updateData, isPending }: CommentFormProps) => {
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<ImageFile[]>([]);
    const expanded = useBoolean(statusChange !== undefined);
    const ref = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCommentDisabled = isPending;

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
        <div ref={ref} className={cn('flex-1 border col-span-full', className)}>
            <div className='p-2'>
                <input
                    type="text"
                    placeholder="Add an update comment (optional)"
                    className='w-full focus:outline-none md:text-sm'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={expanded.setTrue}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isCommentDisabled) {
                            updateData({
                                status: statusChange,
                                content: content,
                                files: attachments
                            });
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
                    onClick={() => updateData({
                        status: statusChange,
                        content: content,
                        files: attachments
                    })}
                    disabled={isCommentDisabled}
                >
                    {isPending ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    )
}

const OwnerComponent = ({ isPending, updateData }: { isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { data: members } = useQuery(membersQuery);

    const { boardSlug, feedbackSlug } = useParams({
        from: Route.fullPath,
    })
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));

    return (
        <Popover
            id="owner-dropdown"
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                    "horizontal center-v min-w-0 group relative px-2 py-1",
                    {
                        "hover:pr-8": feedback?.owner
                    }
                )}>
                    {feedback?.owner && <Avatar
                        src={feedback?.owner?.avatar ?? undefined}
                        name={feedback?.owner?.name ?? 'Unassigned'}
                        className="size-5 text-xs shrink-0"
                    />}
                    <span className="truncate min-w-0">
                        {feedback?.owner?.name ?? 'Unassigned'}
                    </span>
                    {feedback?.owner && <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 flex-shrink-0 hidden group-hover:flex size-7 m-0 border rounded-md p-1 horizontal center [&>svg]:stroke-gray-400 dark:[&>svg]:stroke-zinc-300 hover:bg-gray-100/50 dark:hover:bg-zinc-700/50 transition-colors duration-150 cursor-pointer"
                        data-popover-close
                        onClick={(e) => {
                            e.stopPropagation();
                            updateData({ ownerId: null })
                        }}
                    >
                        <Icons.X className="size-4" />
                    </div>}
                </div>
            }
            content={
                <div className="flex flex-col gap-1">
                    {members?.map(member => (
                        <button
                            key={member.user.id}
                            data-popover-close
                            disabled={isPending || member.user.id === feedback?.owner?.id}
                            className={cn('block text-nowrap w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50', {
                                'bg-gray-100 dark:bg-zinc-800/20': member.user.id === feedback?.owner?.id
                            })}
                            onClick={() => updateData({ ownerId: member.user.id })}
                        >
                            {member.user.name}
                        </button>
                    ))}
                </div>
            }
        />
    )
}

const CategoryComponent = ({ boardSlug, feedbackSlug, isPending, updateData }: { boardSlug: string, feedbackSlug: string, isPending: boolean, updateData: (data: FeedbackUpdateData) => void }) => {
    const { data: categories } = useQuery(categoriesQuery(boardSlug));
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));

    const categoriesToShow = useMemo(() => {
        if (!categories) return [];
        return categories.filter(category => category.board.slug === boardSlug);
    }, [categories, boardSlug]);

    const handleCategoryClick = (categoryId: string | null) => {
        updateData({ categoryId });
    }

    return (
        <Popover
            id="category-dropdown"
            trigger={
                <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                    "horizontal center-v min-w-0 group relative px-2 py-1"
                )}>
                    <span className="truncate">{feedback?.category?.name ?? 'Uncategorized'}</span>
                    <Icons.ChevronDown className="size-3" />
                </div>
            }
            content={
                <div className="flex flex-col gap-1">
                    {categoriesToShow.map(category => (
                        <button
                            key={category.id}
                            data-popover-close
                            disabled={isPending || category.slug === feedback?.category?.slug || (category.slug === 'uncategorized' && !feedback?.category)}
                            className={cn('block text-nowrap w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50', {
                                'bg-gray-100 dark:bg-zinc-800/20': category.slug === feedback?.category?.slug
                            })}
                            onClick={() => handleCategoryClick(category.id === 'uncategorized' ? null : category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            }
        />
    )
}

type EstimatedDeliveryComponentProps = {
    isPending: boolean;
    updateData: (data: FeedbackUpdateData) => void;
    feedbackSlug: string;
    boardSlug: string;
    ref: RefObject<HTMLDivElement | null>;
    open: UseBoolean;
}

const EstimatedDeliveryComponent = ({ isPending, updateData, feedbackSlug, boardSlug, ref, open }: EstimatedDeliveryComponentProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: feedback } = useQuery(feedbackQuery(boardSlug, feedbackSlug));
    const [estimatedDelivery, setEstimatedDelivery] = useState<string>(feedback?.estimatedDelivery ? DateTime.fromJSDate(new Date(feedback.estimatedDelivery)).toFormat('MM/yyyy') : '');
    const [showPublicly, setShowPublicly] = useState(feedback?.publicEstimate ?? true);

    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        open.setTrue();
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const button = document.getElementById('estimated-delivery-trigger');
            if (!ref.current?.contains(event.target as Node) && !button?.contains(event.target as Node)) {
                open.setFalse();
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const isDirty = useMemo(() => {
        if (feedback?.publicEstimate !== showPublicly) return true;
        if (!feedback?.estimatedDelivery) return true;
        if (feedback?.estimatedDelivery && estimatedDelivery !== DateTime.fromJSDate(new Date(feedback.estimatedDelivery)).toFormat('MM/yyyy')) return true;
        return false;
    }, [feedback, showPublicly, estimatedDelivery]);

    useEffect(() => {
        if (open.value) {
            inputRef.current?.focus();
            setEstimatedDelivery(feedback?.estimatedDelivery ? DateTime.fromJSDate(new Date(feedback.estimatedDelivery)).toFormat('MM/yyyy') : '');
        }
    }, [open.value, feedback?.estimatedDelivery]);

    return (
        <>
            {!open.value && (
                <button id="estimated-delivery-trigger" onClick={handleOpen} className="w-fit">
                    <div className={cn("text-sm font-light rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer gap-1",
                        "horizontal center-v min-w-0 group relative px-2 py-1"
                    )}>
                        <span className="truncate">{feedback?.estimatedDelivery ? DateTime.fromJSDate((new Date(feedback.estimatedDelivery))).toFormat('MMM yyyy') : ' - '}</span>
                    </div>
                </button>
            )}
            {open.value &&
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="mm/yyyy"
                    className="w-full focus:outline-none md:text-sm pl-2"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            updateData({
                                estimatedDelivery: estimatedDelivery ?
                                    DateTime.fromFormat(estimatedDelivery, 'MM/yyyy').toJSDate() : null,
                                publicEstimate: showPublicly
                            })
                        }
                    }}
                />
            }
            {open.value && DateTime.fromFormat(estimatedDelivery, 'MM/yyyy').isValid && (
                <div className="horizontal center-v gap-2 col-span-full">
                    <Checkbox
                        label="Show Publicly"
                        checked={showPublicly}
                        onChange={(e) => setShowPublicly(e.target.checked)}
                    />
                    <Button
                        size='sm'
                        className="ml-auto"
                        disabled={isPending || !isDirty || (feedback?.estimatedDelivery === null && !estimatedDelivery) || !DateTime.fromFormat(estimatedDelivery, 'MM/yyyy').isValid}
                        onClick={() => updateData({
                            estimatedDelivery: estimatedDelivery ?
                                DateTime.fromFormat(estimatedDelivery, 'MM/yyyy').toJSDate() : null,
                            publicEstimate: showPublicly
                        })}
                    >
                        Save
                    </Button>
                    {feedback?.estimatedDelivery && <Button size='sm' color='secondary' onClick={() => updateData({ estimatedDelivery: null })}>Clear</Button>}
                </div>
            )}
        </>

    )
}
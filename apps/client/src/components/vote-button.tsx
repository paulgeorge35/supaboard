import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/auth-store";
import { useAnalytics } from "../hooks/useAnalytics";
import { Icons } from "./icons";
import { Skeleton } from "./skeleton";

interface VoteButtonProps {
    votes: number;
    votedByMe: boolean;
    className?: string;
    vote: () => void;
    isPending: boolean;
    isLoading?: boolean;
    contentId?: string;
    contentType?: 'feedback' | 'comment' | 'post';
}

export const VoteButtonSkeleton = () => {
    return (
        <div className="border rounded-md px-2 py-1 w-9 vertical center gap-1">
            <Skeleton className="size-3" />
            <Skeleton className="h-3 w-4" />
        </div>
    )
}

export const VoteButton = ({ votes, votedByMe, className, vote, isPending, isLoading, contentId, contentType = 'feedback' }: VoteButtonProps) => {
    const { user } = useAuthStore();
    const { trackClick, trackContent, trackFeature } = useAnalytics();
    
    const numberFormatted = useMemo(() => {
        if (votes > 1000) {
            return `${(votes / 1000).toFixed(1)}k`;
        }
        return votes;
    }, [votes]);

    if (isLoading) {
        return <VoteButtonSkeleton />
    }

    const handleVote = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isPending) return;
        
        // Track vote button click
        trackClick('vote-button', 'engagement', votedByMe ? 'unvote' : 'vote');
        
        if (!user) {
            // Track authentication prompt
            trackFeature('authentication', 'prompt_required', 'vote_action');
            toast.error("You must be logged in to vote")
            return;
        }
        
        // Track content interaction
        trackContent(contentType, votedByMe ? 'unvote' : 'vote', contentId, undefined, {
            currentVotes: votes,
            userWasVoted: votedByMe,
        });
        
        vote()
    }

    return (
        <button
            type='button'
            className={cn("border hover:border-[var(--color-primary)] [&>span]:text-[var(--color-primary)] [&>svg]:stroke-[var(--color-primary)] rounded-md px-2 py-1 hover:bg-[var(--color-primary)]/30 transition-colors duration-200 group w-9 vertical center gap-1",
                className,
                {
                    "border-[var(--color-primary)] bg-[var(--color-primary)]/20 [&>span]:text-[var(--color-primary)] [&>svg]:stroke-[var(--color-primary)]": votedByMe,
                }
            )}
            onClick={handleVote}>
            <Icons.ChevronUp className="size-3 group-hover:-translate-y-[2px] transition-transform duration-200" />
            <span className="text-gray-500 text-xs">
                {numberFormatted}
            </span>
        </button>
    )
}
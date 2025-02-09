import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/auth-store";
import { Icons } from "./icons";

interface VoteButtonProps {
    votes: number;
    votedByMe: boolean;
    className?: string;
    vote: () => void;
    isPending: boolean;
}

export const VoteButton = ({ votes, votedByMe, className, vote, isPending }: VoteButtonProps) => {
    const { user } = useAuthStore();

    const handleVote = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isPending) return;
        if (!user) {
            toast.error("You must be logged in to vote")
            return;
        }
        vote()
    }

    const numberFormatted = useMemo(() => {
        if (votes > 1000) {
            return `${(votes / 1000).toFixed(1)}k`;
        }
        return votes;
    }, [votes]);

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
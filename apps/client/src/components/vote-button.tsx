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

    return (
        <button
            type='button'
            className={cn("border rounded-md px-2 py-1 hover:bg-gray-50 transition-colors duration-200 group w-9 vertical center gap-1",
                className,
                {
                    "border-blue-500 bg-blue-500/20 [&>span]:text-blue-500 [&>svg]:stroke-blue-500": votedByMe,
                }
            )}
            onClick={handleVote}>
            <Icons.ChevronUp className="size-3 group-hover:-translate-y-[2px] transition-transform duration-200" />
            <span className="text-gray-500 text-xs">
                {votes}
            </span>
        </button>
    )
}
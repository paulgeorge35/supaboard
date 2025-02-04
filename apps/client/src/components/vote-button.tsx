import { Icons } from "./icons";

interface VoteButtonProps {
    votes: number;
}

export const VoteButton = ({ votes }: VoteButtonProps) => {
    return (
        <button type='button' className="border rounded-md px-2 py-1 hover:bg-gray-50 transition-colors duration-200 group w-9 vertical center gap-1">
            <Icons.ChevronUp className="size-3 group-hover:-translate-y-[2px] transition-transform duration-200" />
            <span className="text-gray-500 text-xs">
                {votes}
            </span>
        </button>
    )
}
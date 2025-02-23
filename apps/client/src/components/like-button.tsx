import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/auth-store";
import { Icons } from "./icons";

type LikeButtonProps = {
    likes: number;
    likedByMe: boolean;
    like: () => void;
    isPending: boolean;
}

export function LikeButton({ likes, likedByMe, like, isPending }: LikeButtonProps) {
    const { user } = useAuthStore();

    const text = useMemo(() => {
        if (likes === 0) return;
        if (likes === 1) return '1 like';
        return `${likes} likes`;
    }, [likes]);

    const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isPending) return;
        if (!user) {
            toast.error("You must be logged in to like");
            return;
        }
        like();
    }

    return (
        <button
            onClick={handleLike}
            className={cn(
                'horizontal center-v gap-1 text-xs text-gray-500 hover:text-gray-700 [&>svg]:stroke-gray-500 hover:[&>svg]:fill-gray-500 dark:text-zinc-400 dark:hover:text-zinc-300 dark:[&>svg]:stroke-zinc-400 dark:hover:[&>svg]:fill-zinc-400',
                {
                    '[&>svg]:fill-[var(--color-primary)] [&>svg]:!stroke-[var(--color-primary)] hover:[&>svg]:!fill-[var(--color-primary)] hover:[&>svg]:stroke-[var(--color-primary)]': likedByMe
                }
            )}
        >
            <Icons.Heart size={12} />
            {text}
        </button>
    )
}
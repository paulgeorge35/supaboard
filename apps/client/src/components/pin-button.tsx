import { useAuthStore } from "../stores/auth-store";

type PinButtonProps = {
    pinned: boolean;
    pin: () => void;
    isPending: boolean;
}

export function PinButton({ pinned, pin, isPending }: PinButtonProps) {
    const { user, application } = useAuthStore();

    if (user?.id !== application?.ownerId) return null;

    const handlePin = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (isPending) return;
        pin();
    }

    return (
        <>
            <span className="text-xs text-gray-500 dark:text-zinc-400">&bull;</span>
            <button onClick={handlePin} disabled={isPending} className="text-xs text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300">
                {pinned ? 'Unpin Comment' : 'Pin Comment'}
            </button>
        </>
    )
}
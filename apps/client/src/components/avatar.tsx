import { cn } from "../lib/utils";
import { Icons } from "./icons";

type AvatarProps = {
    src?: string;
    name: string;
    className?: string;
    isAdmin?: boolean;
}

const colors = [
    {
        bg: 'bg-blue-500/20',
        text: 'text-blue-500',
    },
    {
        bg: 'bg-green-500/20',
        text: 'text-green-500',
    },
    {
        bg: 'bg-red-500/20',
        text: 'text-red-500',
    },
    {
        bg: 'bg-purple-500/20',
        text: 'text-purple-500',
    },
    {
        bg: 'bg-yellow-500/20',
        text: 'text-yellow-500',
    },
    {
        bg: 'bg-orange-500/20',
        text: 'text-orange-500',
    },
]
export function Avatar({ src, name, className, isAdmin }: AvatarProps) {
    const color = colors[name.charCodeAt(0) % colors.length]
    return (
        <div className={cn("size-8 rounded-full relative", className)}
        >
            {isAdmin && <Icons.Star className="absolute z-10 right-[-5px] bottom-[-2px] size-[12px] p-[1px] bg-[var(--color-primary)] stroke-[var(--color-primary)] rounded-full fill-white border-white" />}
            {src ?
                <img src={src} alt={name} className="size-8 rounded-full" />
                :
                <span
                    className={cn("aspect-square w-full rounded-full flex items-center justify-center", color.bg, color.text)}
                    style={{
                        mask: isAdmin ? "radial-gradient(circle 8px at 23px 82%, transparent 99%, #fff 100%)" : undefined
                    }}
                >
                    {name.slice(0, 1).toUpperCase()}
                </span>}
        </div>
    )
}
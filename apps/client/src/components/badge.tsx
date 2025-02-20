import { cn } from "@/lib/utils"

type BadgeProps = {
    label: string
    className?: string
}

export const Badge = ({ label, className }: BadgeProps) => {
    return (
        <span className={cn("border px-2 py-1 text-xs font-medium rounded-md", className)}>
            {label}
        </span>
    )
}
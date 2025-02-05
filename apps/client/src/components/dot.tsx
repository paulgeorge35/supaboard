import { cn } from "../lib/utils"

type DotProps = {
    className?: string
}

export const Dot = ({ className }: DotProps) => {
    return (
        <div className={cn('size-2 bg-gray-500 rounded-full', className)} />
    )
}

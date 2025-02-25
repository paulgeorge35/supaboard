import { Status } from "@/lib/query"
import colors from 'tailwindcss/colors'
import { cn } from "../lib/utils"

type DotProps = {
    status: Status
}

export const Dot = ({ status }: DotProps) => {
    const color = status.color.split('-')[0] as Exclude<keyof typeof colors, 'white' | 'black' | 'transparent' | 'inherit' | 'current'>;
    const shade = status.color.split('-')[1] as keyof typeof colors[typeof color];
    return (
        <div
            className={cn('size-2 rounded-full shrink-0 bg-gray-500')}
            style={{
                backgroundColor: colors[color][shade]
            }}
        />
    )
}

import { cn, numberFormatter } from "@/lib/utils";

type CharacterLimitProps = {
    content?: string
    max: number
    className?: string
}

export function CharacterLimit({ content, max, className }: CharacterLimitProps) {
    return (
        <div className={cn("horizontal gap-1 text-xs font-light absolute bottom-0 right-0 border rounded-md px-1 py-0.5", className,
            { "[&>*]:text-red-500 border-red-500": content?.length && content.length > max },
            { "[&>*]:text-orange-500 border-orange-500": content?.length && content.length > max * 0.9 }
        )}>
            <span className="text-gray-500 dark:text-gray-500 ">{numberFormatter(content?.length ?? 0)} / {numberFormatter(max)}</span>
        </div>
    )
}
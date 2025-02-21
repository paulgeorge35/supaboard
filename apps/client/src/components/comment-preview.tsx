import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface CommentPreviewProps {
    content: string | undefined
    mention?: string
    className?: string
}

export const CommentPreview = ({ content, mention, className }: CommentPreviewProps): ReactNode => {
    if (!content) return null

    // If there's a mention, wrap it in a highlighted span
    if (mention && content.startsWith(` ${mention} `)) {
        const mentionText = ` ${mention} `
        return (
            <p className={cn("md:text-sm whitespace-pre-wrap break-words", className)}>
                <span className="bg-[var(--color-primary)]/10 !text-[var(--color-primary)] rounded-sm">
                    {mentionText}
                </span>
                {content.slice(mentionText.length)}
            </p>
        )
    }

    // Otherwise just return the content in a pre tag
    return (
        <p className={cn("md:text-sm whitespace-pre-wrap break-words", className)}>
            {content}
        </p>
    )
} 
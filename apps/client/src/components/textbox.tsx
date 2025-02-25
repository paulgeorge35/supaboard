import { cn } from "@/lib/utils";
import { CharacterLimit } from "./character-limit";
import { CommentPreview } from "./comment-preview";

interface TextboxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
    wrapperClassName?: string;
    maxLength?: number;
    mention?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    expanded?: boolean;
}

export const Textbox = ({ className, maxLength, mention, wrapperClassName, onChange, expanded, ...props }: TextboxProps) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        props.onKeyDown?.(e)
        if (!mention) return

        const mentionLength = `${mention} :`.length
        const cursorPosition = e.currentTarget.selectionStart

        // If backspace is pressed and cursor is within or right after the mention
        if (e.key === 'Backspace' && cursorPosition <= mentionLength && e.currentTarget.value.startsWith(`${mention} :`)) {
            e.preventDefault()
            const newText = e.currentTarget.value.slice(mentionLength)
            e.currentTarget.value = newText
            // Trigger onChange manually since we prevented default
            onChange?.(e as unknown as React.ChangeEvent<HTMLTextAreaElement>)
            // Set cursor to start
            e.currentTarget.setSelectionRange(0, 0)
        }
    }

    return (
        <span className={cn("relative inline-block w-full", wrapperClassName)}>
            {maxLength && <CharacterLimit content={props.value as string} max={maxLength} />}
            {typeof props.value === 'string' && mention && (
                <div
                    className={cn("absolute top-0 left-0 pointer-events-none z-10 mt-1.5 h-full overflow-clip",{
                        "pr-14": maxLength
                    })}
                >
                    <CommentPreview
                        content={props.value}
                        mention={mention}
                    />
                </div>
            )}
            <textarea
                className={cn("w-full focus:outline-none md:text-sm resize-none relative mt-1.5", {
                    "pr-14": maxLength
                },
                    {
                        'text-transparent bg-transparent !caret-zinc-900 dark:!caret-white': typeof props.value === 'string' && mention && props.value
                    },
                    className)} 
                {...props}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                rows={1}
                onFocus={(e) => {
                    e.currentTarget.rows = 5;
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    e.currentTarget.rows = 1;
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.overflow = 'hidden';
                }}
                onInput={(e) => {
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                }}
            />
        </span>
    )
}
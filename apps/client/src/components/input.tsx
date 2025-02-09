import { cn } from "@/lib/utils"
import { forwardRef, useRef } from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string
    prefix?: string
    suffix?: string
    addornmentRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, prefix, suffix, addornmentRight, required, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef

    const handleContainerClick = () => {
        inputRef.current?.focus()
    }

    return (
        <div
            className={cn('vertical items-start gap-2 border rounded-md px-3 py-2 cursor-text focus-within:border-gray-400 dark:focus-within:border-zinc-700', className)}
            onClick={handleContainerClick}
        >
            <label
                htmlFor={props.id}
                className={cn('text-xs font-medium uppercase text-gray-600 dark:text-zinc-500 horizontal gap-1', {
                    'hidden': !label
                })}>
                {label}
                {required && <span className='text-red-500'>*</span>}
            </label>
            <div className='horizontal w-full'>
                <span
                    className={cn('text-sm font-light text-gray-400 dark:text-zinc-600', {
                        'hidden': !prefix
                    })}>
                    {prefix}
                </span>
                <input
                    ref={inputRef}
                    required={required}
                    {...props}
                    className={cn('md:text-sm font-light w-full focus:outline-none disabled:opacity-50', className)}
                />
                <span
                    className={cn('text-sm font-light text-gray-400 dark:text-zinc-600', {
                        'hidden': !suffix
                    })}>
                    {suffix}
                </span>
                {addornmentRight}
            </div>
        </div>
    )
})


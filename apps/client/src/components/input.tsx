import { cn } from "@/lib/utils"
import { forwardRef, useRef } from "react"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    inputClassName?: string
    label?: string
    prefix?: string
    suffix?: string
    addornmentRight?: React.ReactNode
    addornmentLeft?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, prefix, suffix, addornmentRight, addornmentLeft, required, inputClassName, ...props }, ref) => {
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
            <div className='horizontal center-v w-full'>
                {addornmentLeft}
                <span
                    className={cn('text-sm font-light text-gray-400 dark:text-zinc-600', {
                        'hidden': !prefix
                    })}>
                    {prefix}
                </span>
                <input
                    ref={inputRef}
                    {...props}
                    className={cn('md:text-sm font-light w-full focus:outline-none disabled:opacity-50 placeholder:text-gray-500 dark:placeholder:text-zinc-500', inputClassName)}
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


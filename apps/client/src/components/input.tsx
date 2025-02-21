import { cn } from "@/lib/utils"
import { useBoolean, usePasswordStrength } from "@paulgeorge35/hooks"
import { FieldApi } from "@tanstack/react-form"
import { forwardRef, useRef } from "react"
import { Button } from "./button"
import { Icons } from "./icons"
import { PasswordStrength } from "./password-strength"

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    inputClassName?: string
    label?: string
    description?: string
    prefix?: string
    suffix?: string
    addornmentRight?: React.ReactNode
    addornmentLeft?: React.ReactNode
    showStrength?: boolean,
    field?: FieldApi<any, any, any, any>
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, showStrength = false, field, label, prefix, suffix, addornmentRight, addornmentLeft, required, inputClassName, description, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef
    const isVisiblePassword = useBoolean(props.type !== 'password')

    const handleContainerClick = () => {
        inputRef.current?.focus()
    }


    const { strength, criteria, score } = usePasswordStrength(props.type === 'password' && showStrength ? props.value as string ?? '' : '', {
        minLength: 8,
        requireMixedCase: true,
        requireNumber: true,
        requireSpecialChar: true,
    });

    return (
        <div
            className={cn('vertical group items-start gap-2 border rounded-md px-3 py-2 cursor-text focus-within:border-gray-400 dark:focus-within:border-zinc-700', className)}
            onClick={handleContainerClick}
        >
            <label
                htmlFor={props.id}
                className={cn('text-xs font-medium uppercase text-gray-600 dark:text-zinc-500 horizontal center-v gap-1', {
                    'hidden': !label
                })}>
                {label}
                {required && <span className='text-red-500'>*</span>}
                {props.type === 'password' && showStrength && props.value && strength === 'very-strong' && (
                    <Icons.Check className="size-4 stroke-green-500" />
                )}
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
                    type={isVisiblePassword.value ? 'text' : props.type}
                    className={cn('md:text-sm font-light w-full focus:outline-none disabled:opacity-50 placeholder:text-gray-500 dark:placeholder:text-zinc-500', inputClassName)}
                />
                <span
                    className={cn('text-sm font-light text-gray-400 dark:text-zinc-600', {
                        'hidden': !suffix
                    })}>
                    {suffix}
                </span>
                {addornmentRight}
                {props.type === 'password' && (
                    <Button type="button" variant="ghost" size='sm' onClick={isVisiblePassword.toggle}
                        className={cn('opacity-0 transition-opacity duration-200 group-hover:opacity-100', {
                            'opacity-100': isVisiblePassword.value
                        })}
                        tabIndex={-1}
                    >
                        {isVisiblePassword.value ? <Icons.Eye className="size-4" /> : <Icons.EyeOff className="size-4" />}
                    </Button>
                )}
            </div>
            {props.type === 'password' && showStrength && props.value && strength !== 'very-strong' && (
                <div className="horizontal gap-2 items-center w-full">
                    <PasswordStrength
                        strength={strength}
                        criteria={criteria}
                        score={score}
                    />
                </div>
            )}
            {field?.state.meta.isTouched && field?.state.meta.errors.length ? (
                <span className='text-red-500 text-xs font-light'>{typeof field?.state.meta.errors[0] === 'string' ? field?.state.meta.errors[0].split(',')[0] : 'Invalid input'}</span>
            ) : null}
            {description && <span className='text-xs font-light text-gray-400 dark:text-zinc-600'>{description}</span>}
        </div>
    )
})


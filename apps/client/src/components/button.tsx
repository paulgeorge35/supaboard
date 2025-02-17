import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import React from "react";
import { LoadingSpinner } from "./spinner";

const buttonVariants = cva(
    "rounded-md relative cursor-pointer overflow-hidden horizontal center gap-2 transition-colors focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&>svg]:stroke-white dark:[&>svg]:stroke-zinc-900 [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "",
                outline: "!bg-transparent border hover:!bg-zinc-100/50 dark:hover:!bg-zinc-800/50",
                ghost: "!bg-transparent hover:!bg-zinc-100/80 dark:hover:!bg-zinc-800/50 [&>svg]:stroke-zinc-600 dark:[&>svg]:stroke-zinc-50",
                link: "!bg-transparent hover:underline underline-offset-4",
            },
            color: {
                primary: "bg-[var(--color-primary)] text-white dark:text-zinc-900 hover:bg-[var(--color-primary)]/80",
                secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/70 [&>svg]:stroke-zinc-900 dark:[&>svg]:stroke-zinc-50",
                danger: "bg-red-800 text-white hover:bg-red-800/70",
            },
            size: {
                sm: "h-7 px-2 text-sm gap-1 [&>svg]:size-4",
                md: "h-9 px-4 text-base gap-2 [&>svg]:size-5",
                lg: "h-10 px-6 text-lg gap-3 [&>svg]:size-5",
                icon: "size-8",
            },
        },
        defaultVariants: {
            variant: "default",
            color: "primary",
            size: "md",
        },
    }
)

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
    children: React.ReactNode,
    isLoading?: boolean
}

export const Button = React.forwardRef<
    HTMLButtonElement,
    ButtonProps
>(({ className, variant, color, size, isLoading, children, ...props }, ref) => {
    const disabled = props.disabled || isLoading
    return (
        <button ref={ref} className={cn(buttonVariants({ variant, color, size }), className)} {...props} disabled={disabled}>
            {isLoading ?
                <LoadingSpinner />
                : children
            }
        </button>
    )
})


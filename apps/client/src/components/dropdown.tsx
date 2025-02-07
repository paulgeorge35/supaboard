import { type ReactNode } from 'react'

export interface DropdownItem {
    label: string
    onClick?: () => void
    className?: string
    icon?: ReactNode
    disabled?: boolean
}

interface DropdownProps {
    trigger: ReactNode
    items: DropdownItem[]
    header?: ReactNode
    className?: string
    wrapperClassName?: string
    align?: 'left' | 'right'
    disabled?: boolean
}

export function Dropdown({
    trigger,
    items,
    header,
    wrapperClassName,
    className,
    align = 'left',
    disabled = false
}: DropdownProps) {
    return (
        <div className={`relative min-w-0 ${wrapperClassName}`}>
            {/* Trigger Button */}
            <div
                data-popover-trigger
                aria-expanded="false"
                aria-haspopup="true"
                aria-disabled={disabled}
                className={`${disabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
            >
                {trigger}
            </div>

            {/* Dropdown Menu */}
            <div
                className={`absolute ${align}-0 top-full mt-2 rounded-md bg-white dark:bg-zinc-900 shadow-sm border z-50 ring-opacity-5 hidden min-w-fit ${className}`}
                data-popover
                role="menu"
            >
                <div className="py-1" role="none">
                    {/* Optional Header */}
                    {header && (
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                            {header}
                        </div>
                    )}

                    {/* Menu Items */}
                    {items.map((item, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`block text-nowrap w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/20 ${item.className} ${item.disabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                            role="menuitem"
                            onClick={item.onClick}
                            disabled={item.disabled}
                        >
                            {item.icon && (
                                <span className="mr-2 inline-block">{item.icon}</span>
                            )}
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
import { type ReactNode } from 'react'

export interface DropdownItem {
    label: string
    onClick?: () => void
    className?: string
    icon?: ReactNode
}

interface DropdownProps {
    trigger: ReactNode
    items: DropdownItem[]
    header?: ReactNode
    className?: string
    align?: 'left' | 'right'
}

export function Dropdown({
    trigger,
    items,
    header,
    className = '',
    align = 'left'
}: DropdownProps) {
    return (
        <div className="relative">
            {/* Trigger Button */}
            <div
                data-popover-trigger
                aria-expanded="false"
                aria-haspopup="true"
            >
                {trigger}
            </div>

            {/* Dropdown Menu */}
            <div
                className={`absolute ${align}-0 top-full mt-2 rounded-md bg-white shadow-sm border ring-opacity-5 hidden min-w-full ${className}`}
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
                            className={`block w-full text-left px-2 py-1 text-sm ${item.className ?? 'text-gray-700 hover:bg-gray-100'
                                }`}
                            role="menuitem"
                            onClick={item.onClick}
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
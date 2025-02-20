import { cn } from '@/lib/utils'
import { useResizeObserver } from '@paulgeorge35/hooks'
import { useEffect, useRef, useState } from 'react'
import { Label } from 'react-aria-components'
import { Icons } from './icons'

export interface SelectOption {
    label: string
    value: string
    icon?: React.ReactNode
    content?: React.ReactNode
}

interface SelectProps {
    name?: string
    required?: boolean
    label?: string
    options: SelectOption[]
    value?: string | string[]
    onChange?: (value: string | string[]) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    checkMarks?: boolean
    triggerClassName?: string
    selectionMode?: 'single' | 'multiple'
    clearable?: boolean
}

export function SelectComponent({
    name,
    required = false,
    label,
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    disabled,
    checkMarks = false,
    triggerClassName,
    selectionMode = 'single',
    clearable = false
}: SelectProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const { ref: resizeRef, dimensions } = useResizeObserver<HTMLDivElement>({
        immediate: true,
    });

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        if (selectionMode === 'multiple') {
            const newValue = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange?.(newValue);
        } else {
            onChange?.(optionValue);
            setIsOpen(false);
        }
        setSearch('');
    };

    const handleRemoveValue = (e: React.MouseEvent, valueToRemove: string) => {
        e.stopPropagation();
        if (selectionMode === 'multiple') {
            const newValue = selectedValues.filter(v => v !== valueToRemove);
            onChange?.(newValue);
        } else {
            onChange?.('');
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(selectionMode === 'multiple' ? [] : '');
        setSearch('');
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={cn('relative', className)}>
            <div
                ref={resizeRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={cn(
                    "relative w-full cursor-pointer border rounded-md bg-white dark:bg-zinc-900",
                    "hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-200",
                    {
                        "opacity-50 cursor-not-allowed": disabled,
                        "border-[var(--color-primary)]": isOpen,
                    },
                    triggerClassName
                )}
            >
                <div className="horizontal center-v min-h-9 px-2 pl-3 py-1 gap-2">
                    {selectedValues.length > 0 ? (
                        <div className={cn("flex gap-1 grow", {
                            "flex-wrap": selectionMode === 'multiple',
                            "truncate": selectionMode === 'single'
                        })}>
                            {selectedValues.map(val => {
                                const option = options.find(o => o.value === val);
                                return (
                                    <span
                                        key={val}
                                        className={cn(
                                            "text-sm horizontal center-v gap-1",
                                            {
                                                "bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md": selectionMode === 'multiple'
                                            }
                                        )}
                                    >
                                        {option?.content ? (
                                            option.content
                                        ) : (
                                            <>
                                                {option?.icon}
                                                <span className={cn({
                                                    "truncate": selectionMode === 'single'
                                                })}>{option?.label}</span>
                                            </>
                                        )}
                                        {selectionMode === 'multiple' && (
                                            <button
                                                onClick={(e) => handleRemoveValue(e, val)}
                                                className="hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full p-0.5 opacity-50 hover:opacity-100"
                                            >
                                                <Icons.X className="size-3" />
                                            </button>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-gray-500 dark:text-zinc-400 text-sm grow">
                            {placeholder}
                        </span>
                    )}
                    <span className="horizontal center-v gap-1 shrink-0">
                        {clearable && selectedValues.length > 0 && (
                            <>
                                <button
                                    onClick={handleClear}
                                    className="hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full p-1"
                                >
                                    <Icons.X className="size-3" />
                                </button>
                                <div className="h-4 border-l border shrink-0" />
                            </>
                        )}
                        <Icons.ChevronDown
                            className={cn("size-4 transition-transform duration-200", {
                                "rotate-180": isOpen,
                            })}
                        />
                    </span>
                </div>
                {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 border rounded-md bg-white dark:bg-zinc-900 shadow-lg z-50">
                        <input
                            name={name}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border-b focus:outline-none text-sm"
                            placeholder="Search..."
                            autoComplete="off"
                        />
                        <div className="max-h-60 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500 dark:text-zinc-400">
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map(option => (
                                    <div
                                        key={option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        className={cn(
                                            "px-3 py-2 text-sm cursor-pointer horizontal center-v gap-2",
                                            "hover:bg-gray-100 dark:hover:bg-zinc-800",
                                            {
                                                "bg-gray-50 dark:bg-zinc-800": selectedValues.includes(option.value),
                                            }
                                        )}
                                    >
                                        {option.content ? (
                                            option.content
                                        ) : (
                                            <>
                                                {option.icon}
                                                <span className="truncate">{option.label}</span>
                                            </>
                                        )}
                                        {checkMarks && selectedValues.includes(option.value) && (
                                            <Icons.Check className="ml-auto size-4 shrink-0 stroke-[var(--color-primary)]" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {label && (
                <Label className='horizontal center-v gap-1 text-xs uppercase font-medium text-gray-500 dark:text-zinc-500'>
                    {label}
                    {required && <span className='text-red-500'>*</span>}
                </Label>
            )}
        </div>
    );
}
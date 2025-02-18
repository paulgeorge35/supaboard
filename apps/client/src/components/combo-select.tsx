import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useBoolean } from "@paulgeorge35/hooks";
import { useEffect, useRef, useState } from "react";

type Option = {
    label: string;
    value: string;
}

type ComboSelectProps = {
    options: Option[];
    value?: string | string[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    className?: string;
    name?: string;
    disabled?: boolean;
    selectionMode?: 'single' | 'multiple';
}

export function ComboSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className,
    name,
    disabled = false,
    selectionMode = 'single'
}: ComboSelectProps) {
    const ref = useRef<HTMLDivElement>(null);
    const expanded = useBoolean(false);
    const [search, setSearch] = useState('');

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const handleSelect = (optionValue: string) => {
        if (selectionMode === 'multiple') {
            const newValue = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange(newValue);
        } else {
            onChange(optionValue);
            expanded.setFalse();
        }
        setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectionMode === 'multiple' ? [] : '');
        setSearch('');
    };

    const handleRemoveValue = (e: React.MouseEvent, valueToRemove: string) => {
        e.stopPropagation();
        if (selectionMode === 'multiple') {
            const newValue = selectedValues.filter(v => v !== valueToRemove);
            onChange(newValue);
        } else {
            onChange('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                expanded.setFalse();
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <div
                onClick={() => !disabled && expanded.toggle()}
                className={cn(
                    "relative w-full cursor-pointer border rounded-md bg-white dark:bg-zinc-900",
                    "hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-200",
                    {
                        "opacity-50 cursor-not-allowed": disabled,
                        "border-[var(--color-primary)]": expanded.value,
                    },
                    className
                )}
            >
                <div className="horizontal center-v min-h-9 px-2 py-1 gap-2">
                    {selectedValues.length > 0 ? (
                        <div className="flex flex-wrap gap-1 grow">
                            {selectedValues.map(val => {
                                const option = options.find(o => o.value === val);
                                return (
                                    <span
                                        key={val}
                                        className="bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-sm horizontal center-v gap-1 group"
                                    >
                                        {option?.label}
                                        <button
                                            onClick={(e) => handleRemoveValue(e, val)}
                                            className="hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full p-0.5 opacity-50 hover:opacity-100"
                                        >
                                            <Icons.X className="size-3" />
                                        </button>
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
                        {selectedValues.length > 0 && (
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
                                "rotate-180": expanded.value,
                            })}
                        />
                    </span>
                </div>
                {expanded.value && (
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
                                            handleSelect(option.value)
                                        }}
                                        className={cn(
                                            "px-3 py-2 text-sm cursor-pointer",
                                            "hover:bg-gray-100 dark:hover:bg-zinc-800",
                                            {
                                                "bg-gray-50 dark:bg-zinc-800": selectedValues.includes(option.value),
                                            }
                                        )}
                                    >
                                        {option.label}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 
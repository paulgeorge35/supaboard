import { useDebounce, useFocus } from "@paulgeorge35/hooks";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Icons } from "./icons";

type FiltersInputProps = {
    onChange: (value: string) => void;
}

export const FiltersInput = ({ onChange }: FiltersInputProps) => {
    const [ref, isFocused] = useFocus();
    const [search, setSearch] = useState('');
    const { flush } = useDebounce(search, {
        delay: 500,
        onUpdate: (value) => {
            onChange(value);
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    }

    const handleClear = () => {
        flush();
        setSearch('');
    }

    return (
        <>
            <span className={cn("horizontal gap-2", {
                'hidden': isFocused || search.length > 0,
            })}>
                Showing
            </span>
            <span
                className={cn('horizontal center-v gap-2 border rounded-md px-2 py-1 [&>svg]:stroke-gray-500',
                    {
                        'w-full': isFocused || search.length > 0,
                    }
                )}>
                <Icons.Search size={16} />
                <input ref={ref} type="text" placeholder='Search' className='w-full focus:outline-none' value={search} onChange={handleChange} />
                {search.length > 0 && <button className='[&>svg]:stroke-gray-500 hover:[&>svg]:stroke-gray-700' onClick={handleClear}><Icons.X size={16} /></button>}
            </span>
        </>
    )
}
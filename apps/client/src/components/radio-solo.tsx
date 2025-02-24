import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface RadioSoloProps {
  /** Whether the radio is checked */
  checked?: boolean;
  /** Callback when selection changes */
  onChange?: () => void;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** The name attribute for the radio */
  name: string;
  /** The value attribute for the radio */
  value: string;
  /** Additional className for the wrapper */
  className?: string;
}

export const RadioSolo = forwardRef<HTMLDivElement, RadioSoloProps>(
  ({
    checked = false,
    onChange,
    disabled = false,
    name,
    value,
    className
  }, ref) => {
    const id = `${name}-${value}`;

    const handleClick = () => {
      if (disabled) return;
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) {
        input.click();
      }
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex h-5 w-5 group shrink-0", className)}
      >
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          onClick={handleClick}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full border-2 group',
            'border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-800 transition-colors duration-200 ease-in-out peer-checked:border-[var(--color-primary)]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50'
          )}
        >
          <span
            className={cn(
              'size-2 rounded-full opacity-0 transition-opacity',
              'bg-[var(--color-primary)]',
              'peer-checked:opacity-100',
              !checked && 'group-hover:opacity-20',
              checked && 'opacity-100'
            )}
          />
        </span>
      </div>
    );
  }
);

RadioSolo.displayName = 'RadioSolo'; 
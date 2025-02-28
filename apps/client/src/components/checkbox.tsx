import { ComponentPropsWithoutRef, forwardRef, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Icons } from './icons';

export interface CheckboxProps extends ComponentPropsWithoutRef<'input'> {
  /** Label text to display next to checkbox */
  label?: string;
  /** Additional className for the wrapper element */
  wrapperClassName?: string;
  /** Error message to display */
  error?: string;
  /** Additional className for the label */
  labelClassName?: string;
  /** Whether the checkbox is in an indeterminate state */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, wrapperClassName, error, id, checked, disabled, onChange, labelClassName, indeterminate, ...props }, ref) => {
    // Generate a unique ID if none provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    const handleClick = () => {
      if (disabled) return;
      
      // Trigger the change event on the hidden input
      const input = document.getElementById(checkboxId) as HTMLInputElement;
      if (input) {
        input.click();
      }
    };

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        <div className="flex items-center gap-2 group">
          <div className="relative inline-flex h-5 w-5 shrink-0">
            <input
              type="checkbox"
              id={checkboxId}
              ref={(node) => {
                // Handle both refs
                inputRef.current = node;
                if (typeof ref === 'function') {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            <span
              onClick={handleClick}
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-md border-2',
                'border-gray-300 bg-white dark:bg-zinc-900 dark:border-zinc-800 transition-colors duration-200 ease-in-out',
                'peer-checked:[&>svg]:stroke-[var(--color-primary)]',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                error && 'border-red-500',
                className
              )}
            >
              {indeterminate ? (
                <Icons.Minus
                  className={cn(
                    'h-3.5 w-3.5 text-white opacity-0 transition-opacity',
                    'peer-checked:opacity-100 stroke-4',
                    !checked && 'group-hover:opacity-20',
                    (checked || indeterminate) && 'opacity-100',
                    'stroke-[var(--color-primary)]'
                  )}
                />
              ) : (
                <Icons.Check
                  className={cn(
                    'h-3.5 w-3.5 text-white opacity-0 transition-opacity',
                    'peer-checked:opacity-100 stroke-4',
                    !checked && 'group-hover:opacity-20',
                    checked && 'opacity-100'
                  )}
                />
              )}
            </span>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-light dark:text-zinc-300',
                'cursor-pointer select-none',
                labelClassName,
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
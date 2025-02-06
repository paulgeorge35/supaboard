import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface CheckboxProps extends ComponentPropsWithoutRef<'input'> {
  /** Label text to display next to checkbox */
  label?: string;
  /** Additional className for the wrapper element */
  wrapperClassName?: string;
  /** Error message to display */
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, wrapperClassName, error, id, ...props }, ref) => {
    // Generate a unique ID if none provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-light',
                'cursor-pointer',
                props.disabled && 'cursor-not-allowed opacity-50'
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
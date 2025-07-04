import { useCallback, useEffect, useRef, useState } from "react";

export type UseDebounceStatus = "idle" | "pending" | "cancelled";

export type UseDebounceOptions<T> = {
  /** The delay in milliseconds
   *
   * @default 500
   */
  delay?: number;
  /** Callback to run when the value is updated */
  onUpdate?: (value: T) => void;
  /** Whether to update on component unmount
   *
   * @default false
   */
  updateOnUnmount?: boolean;
};

export type UseDebounceResult<T> = {
  /** The debounced value */
  value: T;
  /** The current status of the debounce */
  status: UseDebounceStatus;
  /** Force an immediate update */
  flush: () => void;
  /** Cancel the current debounce */
  cancel: () => void;
};

/**
 * A hook that returns a debounced value that only updates after a specified delay
 * of inactivity. Includes additional features like immediate updates, maximum wait
 * time, and manual control.
 *
 * @template T - The type of the value to debounce
 * @param value - The value to debounce
 * @param options - Configuration options
 * @returns Object containing the debounced value and control functions
 *
 * @example
 * ```tsx
 * // Basic usage with search input
 * const [searchTerm, setSearchTerm] = useState('');
 * const { value: debouncedSearch } = useDebounce(searchTerm, {
 *   delay: 300,
 *   onUpdate: (value) => performSearch(value)
 * });
 *
 * return (
 *   <input
 *     type="text"
 *     value={searchTerm}
 *     onChange={(e) => setSearchTerm(e.target.value)}
 *     placeholder="Search..."
 *   />
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with all features
 * const [value, setValue] = useState('');
 * const {
 *   value: debouncedValue,
 *   isPending,
 *   flush,
 *   cancel
 * } = useDebounce(value, {
 *   delay: 1000,
 *   onUpdate: (v) => console.log('Updated:', v),
 *   updateOnUnmount: true
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *     />
 *     {isPending && <span>Waiting to update...</span>}
 *     <button onClick={flush}>Update Now</button>
 *     <button onClick={cancel}>Cancel Update</button>
 *   </div>
 * );
 * ```
 */
export function useDebounce<T>(
  value: T,
  { delay = 500, onUpdate, updateOnUnmount = false }: UseDebounceOptions<T> = {}
): UseDebounceResult<T> {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [status, setStatus] = useState<UseDebounceStatus>("idle");

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  const lastUpdateRef = useRef<number>(Date.now());
  const cancelledValueRef = useRef<T | null>(null);

  // Update the value ref
  valueRef.current = value;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Update function
  const update = useCallback(() => {
    setDebouncedValue(valueRef.current);
    setStatus("idle");
    lastUpdateRef.current = Date.now();
    cancelledValueRef.current = null;
    onUpdate?.(valueRef.current);
    cleanup();
  }, [cleanup, onUpdate]);

  // Force an immediate update
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      update();
    }
  }, [update]);

  // Cancel the current debounce
  const cancel = useCallback(() => {
    cleanup();
    setStatus("cancelled");
    cancelledValueRef.current = valueRef.current;
  }, [cleanup]);

  // Set up the debounce effect
  useEffect(() => {
    // Resume debouncing only if we have a new value after cancellation
    if (status === "cancelled") {
      if (cancelledValueRef.current !== value) {
        setStatus("idle");
        cancelledValueRef.current = null;
      }
      return;
    }

    if (Object.is(debouncedValue, value)) return;

    setStatus("pending");

    // Set up the main debounce timeout
    timeoutRef.current = setTimeout(update, delay);

    // Cleanup on value change or unmount
    return () => {
      if (updateOnUnmount) {
        update();
      } else {
        cleanup();
      }
    };
  }, [delay, update, cleanup, updateOnUnmount, debouncedValue, value, status]);

  return {
    value: debouncedValue,
    status,
    flush,
    cancel,
  };
}

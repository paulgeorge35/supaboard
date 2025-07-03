import { useCallback, useEffect, useRef } from "react";
import { useBoolean } from "./useBoolean";

export type FocusableElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLButtonElement
  | HTMLAnchorElement;

export type UseFocus<T> = [React.RefObject<T | null>, boolean];

export type UseFocusProps = {
  /** Optional callback to be called when the element receives focus */
  onFocus?: (event: FocusEvent) => void;
  /** Optional callback to be called when the element loses focus */
  onBlur?: (event: FocusEvent) => void;
};

/**
 * A hook that tracks and manages the focus state of a focusable DOM element with improved
 * type safety and additional features. Only works with standard focusable elements like
 * inputs, textareas, buttons, etc.
 *
 * @template T - The type of focusable element
 * @param props - The hook's configuration object
 * @returns A tuple containing the focus state and control functions
 *
 * @example
 * ```tsx
 * // Basic usage with an input
 * const [ref, isFocused] = useFocus<HTMLInputElement>({
 *   onFocus: () => console.log('Input focused'),
 *   onBlur: () => console.log('Input blurred')
 * });
 *
 * return (
 *   <input
 *     ref={ref}
 *     type="text"
 *     className={isFocused ? 'focused' : ''}
 *   />
 * );
 * ```
 */
export const useFocus = <T extends FocusableElement = HTMLInputElement>({
  onFocus,
  onBlur,
}: UseFocusProps = {}): UseFocus<T> => {
  const ref = useRef<T | null>(null);
  const isFocused = useBoolean(false);

  const handleFocus = useCallback(
    (e: Event) => {
      isFocused.setTrue();
      onFocus?.(e as FocusEvent);
    },
    [onFocus, isFocused]
  );

  const handleBlur = useCallback(
    (e: Event) => {
      isFocused.setFalse();
      onBlur?.(e as FocusEvent);
    },
    [onBlur, isFocused]
  );

  useEffect(() => {
    const element = ref.current;
    const abortController = new AbortController();

    element?.addEventListener("focus", handleFocus, {
      signal: abortController.signal,
    });
    element?.addEventListener("blur", handleBlur, {
      signal: abortController.signal,
    });

    return () => {
      abortController.abort();
    };
  }, [handleFocus, handleBlur]);

  return [ref, isFocused.value];
};

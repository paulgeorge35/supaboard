import { type RefObject, useEffect, useRef } from "react";
import { useBoolean } from "./useBoolean";

type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

export type UseVisibilityOptions = {
  /** Optional initial visibility state
   * @default false
   */
  initial?: boolean;
  /** Optional delay in milliseconds before the element is set as visible
   * @default 100
   */
  delay?: number;
  /** Optional flag to stop tracking the element once it is visible
   * @default false
   */
  once?: boolean;
  /** Optional threshold for visibility detection (0-100).
   * For example, a threshold of 50 means the element is considered visible once 50% of it is visible.
   * For 0, the element is considered visible once it is right on the edge of the viewport.
   * For 100, the element is considered visible once it is completely visible.
   * @default 50
   */
  threshold?: IntRange<0, 101>;
};

export type UseVisibility<T extends HTMLElement> = {
  /** Whether the element is visible */
  isVisible: boolean;
  /** Whether the element is currently being tracked */
  isTracking: boolean;
  /** Ref to the element */
  ref: RefObject<T>;
};

export type UseVisibilityCallback<T extends HTMLElement> = (
  props: UseVisibility<T>
) => void;

/**
 * A hook that tracks the visibility of an element in the viewport.
 *
 * @template T - The type of the element to track
 * @param options - The options for the hook
 * @param callback - The callback to call when the element is visible
 * @returns The visibility state of the element
 *
 * @example
 * ```tsx
 * const [isVisible, isTracking, ref] = useVisibility<HTMLDivElement>({
 *   delay: 100,
 *   once: true,
 *   threshold: 50,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isVisible ? 'Visible' : 'Not visible'}
 *   </div>
 * );
 * ```
 */
export function useVisibility<T extends HTMLElement>(
  {
    initial = false,
    delay = 0,
    once = false,
    threshold = 0,
  }: UseVisibilityOptions = {
    initial: false,
    delay: 0,
    once: false,
    threshold: 0,
  },
  callback?: UseVisibilityCallback<T>
): UseVisibility<T> {
  const visibility = useBoolean(initial);
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Cleanup function for the observer and timeout
    const cleanup = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    // Only continue observing if not using 'once' option or element is not yet visible
    if (once && visibility.value) {
      cleanup();
      return;
    }

    // Create new IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const isIntersecting = entry.isIntersecting;

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (isIntersecting) {
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              visibility.setTrue();
              if (!visibility.value) {
                callback?.({
                  isVisible: true,
                  isTracking: !once,
                  ref: ref as RefObject<T>,
                });
              }
            }, delay);
          } else {
            if (!visibility.value) {
              visibility.setTrue();
              callback?.({
                isVisible: true,
                isTracking: !once,
                ref: ref as RefObject<T>,
              });
            }
          }
        } else {
          if (visibility.value) {
            visibility.setFalse();
            callback?.({
              isVisible: false,
              isTracking: !once || !visibility.value,
              ref: ref as RefObject<T>,
            });
          }
        }
      },
      {
        threshold: threshold / 100,
      }
    );

    // Start observing the element
    observerRef.current.observe(element);

    // Cleanup on unmount or when dependencies change
    return cleanup;
  }, [delay, once, threshold, visibility, callback]);

  return {
    isVisible: visibility.value,
    isTracking: !once || !visibility.value,
    ref: ref as RefObject<T>,
  };
}

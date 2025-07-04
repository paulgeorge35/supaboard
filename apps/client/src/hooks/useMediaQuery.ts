import { useCallback, useEffect, useMemo, useState } from "react";

export type MediaQueryResult = {
  /** Whether the media query matches */
  matches: boolean;
  /** The media query string being watched */
  query: string;
  /** The MediaQueryList object for advanced usage */
  mediaQueryList: MediaQueryList | null;
};

export type UseMediaQueryOptions = {
  /** Whether to initialize the hook immediately */
  immediate?: boolean;
  /** Whether to disable the media query listener */
  disabled?: boolean;
  /** Callback when the media query match state changes */
  onChange?: (matches: boolean) => void;
};

/**
 * A hook that tracks whether a CSS media query matches the current window state.
 * Includes performance optimizations and enhanced features.
 *
 * @param query - The media query string to match against (e.g., '(max-width: 768px)')
 * @param options - Configuration options
 * @returns An object containing the match state and related information
 *
 * @example
 * ```tsx
 * // Basic responsive layout
 * const { matches: isMobile } = useMediaQuery('(max-width: 768px)');
 *
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *   </div>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with all features
 * const { matches, mediaQueryList } = useMediaQuery(
 *   '(prefers-color-scheme: dark)',
 *   {
 *     immediate: true,
 *     onChange: (isDark) => {
 *       console.log('Dark mode:', isDark);
 *       updateTheme(isDark ? 'dark' : 'light');
 *     }
 *   }
 * );
 *
 * // Access mediaQueryList for advanced features
 * useEffect(() => {
 *   if (mediaQueryList?.media.includes('prefers-color-scheme')) {
 *     // Handle system theme preference
 *   }
 * }, [mediaQueryList]);
 * ```
 */
export function useMediaQuery(
  query: string,
  { immediate = true, disabled = false, onChange }: UseMediaQueryOptions = {}
): MediaQueryResult {
  // Memoize the query to prevent unnecessary re-renders
  const mediaQuery = useMemo(() => query.trim(), [query]);

  // State for match status and MediaQueryList
  const [matches, setMatches] = useState<boolean>(() => {
    if (!immediate || typeof window === "undefined" || disabled) return false;
    try {
      return window.matchMedia(mediaQuery).matches;
    } catch (error) {
      console.warn(`Invalid media query: ${mediaQuery}`, error);
      return false;
    }
  });

  const [mediaQueryList, setMediaQueryList] = useState<MediaQueryList | null>(
    null
  );

  // Create a stable callback for the change handler
  const handleChange = useCallback(
    (event: MediaQueryListEvent) => {
      setMatches(event.matches);
      onChange?.(event.matches);
    },
    [onChange]
  );

  // Set up the media query listener
  useEffect(() => {
    if (typeof window === "undefined" || disabled) return;

    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia(mediaQuery);

      if (mql) {
        if (immediate) {
          setMatches(mql.matches);
        }
        setMediaQueryList(mql);
        mql.addEventListener("change", handleChange);

        return () => {
          mql?.removeEventListener("change", handleChange);
        };
      }
    } catch (error) {
      console.warn(
        `Error setting up media query listener for: ${mediaQuery}`,
        error
      );
    }
  }, [mediaQuery, handleChange, disabled, immediate]);

  return useMemo(
    () => ({
      matches,
      query: mediaQuery,
      mediaQueryList,
    }),
    [matches, mediaQuery, mediaQueryList]
  );
}

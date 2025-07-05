import { useMediaQuery } from "@/hooks";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Props for the CookieConsentBanner component
 */
interface CookieConsentBannerProps {
  /**
   * Callback function called when user accepts cookies
   */
  onAccept: () => void;
  /**
   * Callback function called when user declines cookies
   */
  onDecline: () => void;
}

/**
 * CookieConsentBanner component for displaying cookie consent to users.
 *
 * This component shows a banner at the bottom of the screen asking users for consent
 * to use tracking technologies. It's responsive and includes a link to privacy details.
 *
 * @param props - The component props
 * @param props.onAccept - Callback when user accepts cookies
 * @param props.onDecline - Callback when user declines cookies
 *
 * @returns JSX.Element - The cookie consent banner
 *
 * @example
 * ```tsx
 * <CookieConsentBanner
 *   onAccept={() => setConsentStatus("accepted")}
 *   onDecline={() => setConsentStatus("declined")}
 * />
 * ```
 */
export function CookieConsentBanner({
  onAccept,
  onDecline,
}: CookieConsentBannerProps) {
  const isMobile = useMediaQuery("(max-width: 767px)").matches;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed z-50 flex flex-col gap-4 border border-stone-500 bg-stone-900/95 p-4 shadow-lg backdrop-blur-sm",
        {
          "inset-x-4 bottom-4": isMobile,
          "bottom-8 left-0 right-0 mx-auto w-fit": !isMobile,
        }
      )}
    >
      <p className="text-xs break-words hyphens-auto text-stone-50 sm:text-left md:max-w-[400px]">
        This site uses tracking technologies. You may opt in or opt out of the
        use of these technologies.
      </p>
      <div className="flex flex-shrink-0 items-center justify-center gap-2">
        <button
          onClick={onDecline}
          className="rounded-md border border-stone-500 px-3 py-1 text-xs text-stone-50 transition-colors hover:border-white hover:text-white"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="rounded-md border border-stone-500 px-3 py-1 text-xs text-stone-50 transition-colors hover:border-white hover:text-white"
        >
          Accept
        </button>
        <a
          href={`${import.meta.env.VITE_APP_URL}/privacy`}
          className="ml-auto text-xs text-stone-400 underline transition-colors hover:text-white"
        >
          Details
        </a>
      </div>
    </motion.div>
  );
}

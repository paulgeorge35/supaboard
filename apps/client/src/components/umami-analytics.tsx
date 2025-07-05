import { useEffect } from "react";

/**
 * Props for the UmamiAnalytics component
 */
interface UmamiAnalyticsProps {
  /**
   * The Umami website/app ID. If not provided, will fall back to VITE_UMAMI_APP_ID environment variable
   */
  appId?: string;
}

/**
 * UmamiAnalytics component for integrating Umami web analytics into a Vite React application.
 *
 * This component conditionally injects the Umami analytics script based on environment and configuration.
 * In development mode, it logs debug information but doesn't inject the script to avoid sending
 * development data to the analytics server.
 *
 * @param props - The component props
 * @param props.appId - Optional Umami website ID. Falls back to VITE_UMAMI_APP_ID env var
 *
 * @returns JSX.Element | null - The analytics component or null if conditions aren't met
 *
 * @example
 * ```tsx
 * // Using environment variable
 * <UmamiAnalytics />
 *
 * // Using explicit app ID
 * <UmamiAnalytics appId="your-umami-app-id" />
 * ```
 */
export function UmamiAnalytics({ appId }: UmamiAnalyticsProps) {
  const UMAMI_APP_ID = appId ?? import.meta.env.VITE_UMAMI_APP_ID;
  const NODE_ENV = import.meta.env.MODE;

  useEffect(() => {
    if (!UMAMI_APP_ID) {
      return;
    }

    if (NODE_ENV === "development") {
      console.log(
        `[Umami Web Analytics] App ID: ${UMAMI_APP_ID}`,
        "\nDebug mode is enabled by default in development. No requests will be sent to the server."
      );
      return;
    }

    // Check if script already exists to prevent duplicate injection
    const existingScript = document.querySelector("script[data-website-id]");
    if (existingScript) {
      return;
    }

    // Create and inject the Umami script
    const script = document.createElement("script");
    script.src = "https://umami.paulgeorge.dev/script.js";
    script.setAttribute("data-website-id", UMAMI_APP_ID);
    script.defer = true;
    script.async = true;

    // Add the script to the document head
    document.head.appendChild(script);

    // Cleanup function to remove script if component unmounts
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [UMAMI_APP_ID, NODE_ENV]);

  // This component doesn't render anything visible
  return null;
}

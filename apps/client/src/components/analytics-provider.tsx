"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { CookieConsentBanner } from "./cookie-consent-banner";
import { UmamiAnalytics } from "./umami-analytics";

const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
};

export function AnalyticsProvider() {
  const [consentStatus, setConsentStatus] = useLocalStorage<
    "accepted" | "declined" | null
  >("cookie-consent-v1", null); // Added versioning
  const hasMounted = useHasMounted();

  const handleAccept = () => setConsentStatus("accepted");
  const handleDecline = () => setConsentStatus("declined");

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {consentStatus === "accepted" && (
        <>
          <UmamiAnalytics appId="b379105b-c735-4d4b-8575-b5e427b35b1e" />
        </>
      )}
      {consentStatus === null && (
        <CookieConsentBanner
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
    </>
  );
}

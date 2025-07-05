import { useCallback } from "react";
import { useAnalytics } from "./useAnalytics";

export interface ClickTrackingOptions {
  // Basic tracking info
  element: string;
  section?: string;
  value?: string | number;
  position?: number;
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Feature-specific tracking
  featureName?: string;
  featureAction?: string;
  
  // Content-specific tracking
  contentType?: 'feedback' | 'comment' | 'roadmap' | 'vote' | 'reaction';
  contentAction?: 'create' | 'update' | 'delete' | 'view' | 'share' | 'click';
  contentId?: string;
  contentTitle?: string;
  
  // Custom event tracking
  customEvent?: string;
  customData?: Record<string, any>;
}

export function useClickTracking() {
  const { trackClick, trackFeature, trackContent, track } = useAnalytics();

  const trackClickEvent = useCallback((options: ClickTrackingOptions) => {
    const {
      element,
      section,
      value,
      position,
      metadata,
      featureName,
      featureAction,
      contentType,
      contentAction,
      contentId,
      contentTitle,
      customEvent,
      customData,
    } = options;

    // Track basic click
    trackClick(element, section, value, position);

    // Track feature usage if specified
    if (featureName && featureAction) {
      trackFeature(featureName, featureAction, value, metadata);
    }

    // Track content interaction if specified
    if (contentType && contentAction) {
      trackContent(contentType, contentAction, contentId, contentTitle, metadata);
    }

    // Track custom event if specified
    if (customEvent) {
      track(customEvent, customData);
    }
  }, [trackClick, trackFeature, trackContent, track]);

  // Enhanced click handler that can be used directly in onClick
  const createClickHandler = useCallback((
    options: ClickTrackingOptions,
    originalHandler?: (event: any) => void
  ) => {
    return (event: any) => {
      // Track the click
      trackClickEvent(options);
      
      // Call original handler if provided
      if (originalHandler) {
        originalHandler(event);
      }
    };
  }, [trackClickEvent]);

  // Quick tracking functions for common scenarios
  const trackButtonClick = useCallback((buttonName: string, section?: string, metadata?: Record<string, any>) => {
    trackClickEvent({
      element: 'button',
      section,
      value: buttonName,
      metadata,
    });
  }, [trackClickEvent]);

  const trackLinkClick = useCallback((linkName: string, href: string, section?: string) => {
    trackClickEvent({
      element: 'link',
      section,
      value: linkName,
      metadata: { href },
    });
  }, [trackClickEvent]);

  const trackNavigationClick = useCallback((navItem: string, section?: string) => {
    trackClickEvent({
      element: 'navigation',
      section,
      value: navItem,
      featureName: 'navigation',
      featureAction: 'click',
    });
  }, [trackClickEvent]);

  const trackModalAction = useCallback((modalName: string, action: string, metadata?: Record<string, any>) => {
    trackClickEvent({
      element: 'modal',
      section: modalName,
      value: action,
      featureName: 'modal',
      featureAction: action,
      metadata,
    });
  }, [trackClickEvent]);

  const trackTabClick = useCallback((tabName: string, tabGroup: string, tabIndex?: number) => {
    trackClickEvent({
      element: 'tab',
      section: tabGroup,
      value: tabName,
      position: tabIndex,
      featureName: 'tabs',
      featureAction: 'switch',
    });
  }, [trackClickEvent]);

  const trackDropdownAction = useCallback((dropdownName: string, selectedValue: string, metadata?: Record<string, any>) => {
    trackClickEvent({
      element: 'dropdown',
      section: dropdownName,
      value: selectedValue,
      featureName: 'dropdown',
      featureAction: 'select',
      metadata,
    });
  }, [trackClickEvent]);

  const trackFilterAction = useCallback((filterName: string, filterValue: string, section?: string) => {
    trackClickEvent({
      element: 'filter',
      section,
      value: filterValue,
      featureName: 'filtering',
      featureAction: filterName,
    });
  }, [trackClickEvent]);

  const trackSortAction = useCallback((sortBy: string, sortOrder: 'asc' | 'desc', section?: string) => {
    trackClickEvent({
      element: 'sort',
      section,
      value: sortBy,
      featureName: 'sorting',
      featureAction: 'sort',
      metadata: { sortOrder },
    });
  }, [trackClickEvent]);

  const trackCardClick = useCallback((cardType: string, cardId: string, cardTitle?: string, metadata?: Record<string, any>) => {
    trackClickEvent({
      element: 'card',
      section: cardType,
      value: cardId,
      contentType: cardType as any,
      contentAction: 'view',
      contentId: cardId,
      contentTitle: cardTitle,
      metadata,
    });
  }, [trackClickEvent]);

  return {
    trackClickEvent,
    createClickHandler,
    trackButtonClick,
    trackLinkClick,
    trackNavigationClick,
    trackModalAction,
    trackTabClick,
    trackDropdownAction,
    trackFilterAction,
    trackSortAction,
    trackCardClick,
  };
}
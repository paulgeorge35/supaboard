import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Enhanced analytics event types
export interface AnalyticsEvent {
  // User interactions
  click?: {
    element: string;
    section?: string;
    value?: string | number;
    position?: number;
  };
  
  // Form events
  form?: {
    action: 'submit' | 'focus' | 'blur' | 'error' | 'validation_error';
    form_name: string;
    field_name?: string;
    error_message?: string;
    form_data?: Record<string, any>;
  };
  
  // Navigation events
  navigation?: {
    from: string;
    to: string;
    method: 'link' | 'button' | 'programmatic' | 'back' | 'forward';
  };
  
  // Feature usage
  feature?: {
    name: string;
    action: string;
    value?: string | number;
    metadata?: Record<string, any>;
  };
  
  // Performance events
  performance?: {
    event_type: 'page_load' | 'api_call' | 'component_render' | 'bundle_load';
    duration_ms: number;
    resource?: string;
    status?: 'success' | 'error' | 'timeout';
    error_message?: string;
  };
  
  // Content events
  content?: {
    type: 'feedback' | 'comment' | 'roadmap' | 'vote' | 'reaction';
    action: 'create' | 'update' | 'delete' | 'view' | 'share';
    content_id?: string;
    content_title?: string;
    metadata?: Record<string, any>;
  };
  
  // Search events
  search?: {
    query: string;
    results_count: number;
    selected_result_position?: number;
    filter_applied?: Record<string, any>;
  };
  
  // Error events
  error?: {
    type: 'javascript' | 'api' | 'network' | 'validation' | 'permission';
    message: string;
    stack?: string;
    url?: string;
    status_code?: number;
    user_action?: string;
  };
}

// User properties for segmentation
export interface UserProperties {
  user_id?: string;
  user_type?: 'admin' | 'user' | 'guest';
  tenant_id?: string;
  tenant_name?: string;
  subscription_type?: string;
  user_role?: string;
  session_id?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  country?: string;
  language?: string;
  timezone?: string;
  screen_resolution?: string;
  is_returning_user?: boolean;
  days_since_signup?: number;
  total_sessions?: number;
  features_used?: string[];
}

// Performance monitoring
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  resource?: string;
  status?: 'success' | 'error' | 'timeout';
}

export function useAnalytics() {
  const { user, application } = useAuthStore();
  const performanceRef = useRef<Map<string, PerformanceMetrics>>(new Map());
  const sessionIdRef = useRef<string>();
  
  // Generate session ID on first use
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Get enhanced user properties
  const getUserProperties = useCallback((): UserProperties => {
    const userAgent = navigator.userAgent;
    const getDeviceType = () => {
      if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        return /iPad|Android.*(?:Mobile|Tab)|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
      }
      return 'desktop';
    };
    
    const getBrowser = () => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };
    
    const getOS = () => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    return {
      user_id: user?.id || 'guest',
      user_type: user?.role === 'admin' ? 'admin' : user ? 'user' : 'guest',
      tenant_id: application?.id,
      tenant_name: application?.name,
      session_id: sessionIdRef.current,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_resolution: `${screen.width}x${screen.height}`,
      is_returning_user: localStorage.getItem('returning_user') === 'true',
      // Add more user properties as needed
    };
  }, [user, application]);

  // Enhanced track function
  const track = useCallback((eventName: string, eventData?: AnalyticsEvent) => {
    if (!window.umami) {
      console.warn('[Analytics] Umami not loaded yet');
      return;
    }

    const userProperties = getUserProperties();
    const enhancedEventData = {
      ...eventData,
      user_properties: userProperties,
      timestamp: Date.now(),
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
    };

    try {
      window.umami.track(eventName, enhancedEventData);
      
      // Debug logging in development
      if (import.meta.env.MODE === 'development') {
        console.log(`[Analytics] Event tracked: ${eventName}`, enhancedEventData);
      }
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }, [getUserProperties]);

  // Page view tracking
  const trackPageView = useCallback((pageName?: string) => {
    const page = pageName || window.location.pathname;
    track('page_view', {
      navigation: {
        from: document.referrer,
        to: page,
        method: 'programmatic'
      }
    });
  }, [track]);

  // Click tracking
  const trackClick = useCallback((element: string, section?: string, value?: string | number, position?: number) => {
    track('click', {
      click: {
        element,
        section,
        value,
        position
      }
    });
  }, [track]);

  // Form tracking
  const trackForm = useCallback((action: 'submit' | 'focus' | 'blur' | 'error' | 'validation_error', formName: string, fieldName?: string, errorMessage?: string, formData?: Record<string, any>) => {
    track('form_interaction', {
      form: {
        action,
        form_name: formName,
        field_name: fieldName,
        error_message: errorMessage,
        form_data: formData
      }
    });
  }, [track]);

  // Feature usage tracking
  const trackFeature = useCallback((name: string, action: string, value?: string | number, metadata?: Record<string, any>) => {
    track('feature_usage', {
      feature: {
        name,
        action,
        value,
        metadata
      }
    });
  }, [track]);

  // Content interaction tracking
  const trackContent = useCallback((type: 'feedback' | 'comment' | 'roadmap' | 'vote' | 'reaction', action: 'create' | 'update' | 'delete' | 'view' | 'share', contentId?: string, contentTitle?: string, metadata?: Record<string, any>) => {
    track('content_interaction', {
      content: {
        type,
        action,
        content_id: contentId,
        content_title: contentTitle,
        metadata
      }
    });
  }, [track]);

  // Search tracking
  const trackSearch = useCallback((query: string, resultsCount: number, selectedResultPosition?: number, filterApplied?: Record<string, any>) => {
    track('search', {
      search: {
        query,
        results_count: resultsCount,
        selected_result_position: selectedResultPosition,
        filter_applied: filterApplied
      }
    });
  }, [track]);

  // Error tracking
  const trackError = useCallback((type: 'javascript' | 'api' | 'network' | 'validation' | 'permission', message: string, stack?: string, url?: string, statusCode?: number, userAction?: string) => {
    track('error', {
      error: {
        type,
        message,
        stack,
        url,
        status_code: statusCode,
        user_action: userAction
      }
    });
  }, [track]);

  // Performance tracking
  const startPerformanceTracking = useCallback((resource: string) => {
    const id = `${resource}_${Date.now()}`;
    performanceRef.current.set(id, {
      startTime: performance.now(),
      resource
    });
    return id;
  }, []);

  const endPerformanceTracking = useCallback((id: string, status: 'success' | 'error' | 'timeout' = 'success', errorMessage?: string) => {
    const metrics = performanceRef.current.get(id);
    if (!metrics) return;
    
    const endTime = performance.now();
    const duration = endTime - metrics.startTime;
    
    track('performance', {
      performance: {
        event_type: 'api_call',
        duration_ms: Math.round(duration),
        resource: metrics.resource,
        status,
        error_message: errorMessage
      }
    });
    
    performanceRef.current.delete(id);
  }, [track]);

  // Track API calls with performance
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const performanceId = startPerformanceTracking(endpoint);
    
    try {
      const result = await apiCall();
      endPerformanceTracking(performanceId, 'success');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      endPerformanceTracking(performanceId, 'error', errorMessage);
      
      // Track the error
      trackError('api', errorMessage, undefined, endpoint);
      
      throw error;
    }
  }, [startPerformanceTracking, endPerformanceTracking, trackError]);

  // Auto-track JavaScript errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      trackError('javascript', event.message, event.error?.stack, event.filename, event.lineno);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || 'Unhandled promise rejection';
      trackError('javascript', message, event.reason?.stack);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackError]);

  // Track user as returning user
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('returning_user', 'true');
    }
  }, [user?.id]);

  // Track page load performance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            track('performance', {
              performance: {
                event_type: 'page_load',
                duration_ms: Math.round(navigation.loadEventEnd - navigation.fetchStart),
                resource: window.location.pathname,
                status: 'success'
              }
            });
          }
        }, 0);
      });
    }
  }, [track]);

  return {
    track,
    trackPageView,
    trackClick,
    trackForm,
    trackFeature,
    trackContent,
    trackSearch,
    trackError,
    trackApiCall,
    startPerformanceTracking,
    endPerformanceTracking,
    getUserProperties,
  };
}
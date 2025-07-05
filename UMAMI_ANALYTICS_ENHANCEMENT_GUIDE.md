# Umami Analytics Enhancement Guide

## Overview

This guide documents the comprehensive enhancements made to the Umami Analytics implementation in the application. The improvements include advanced event tracking, user behavior analytics, performance monitoring, and error tracking.

## 🚀 New Features Added

### 1. Enhanced Analytics Hook (`useAnalytics`)

**Location**: `apps/client/src/hooks/useAnalytics.ts`

A comprehensive analytics hook that provides:

- **Event Tracking**: Track user interactions, form submissions, content interactions
- **Performance Monitoring**: API call timing, page load performance
- **Error Tracking**: JavaScript errors, API failures, validation errors
- **User Segmentation**: Device type, browser, OS, user type, session tracking
- **Content Analytics**: Feedback, comments, votes, reactions
- **Search Analytics**: Query tracking, result interactions
- **Feature Usage**: Track which features are being used

#### Key Methods:

```typescript
const {
  track,                    // Generic event tracking
  trackPageView,           // Page navigation tracking
  trackClick,              // Click event tracking
  trackForm,               // Form interaction tracking
  trackFeature,            // Feature usage tracking
  trackContent,            // Content interaction tracking
  trackSearch,             // Search behavior tracking
  trackError,              // Error tracking
  trackApiCall,            // API call performance tracking
  getUserProperties,       // Enhanced user data
} = useAnalytics();
```

### 2. Click Tracking Hook (`useClickTracking`)

**Location**: `apps/client/src/hooks/useClickTracking.ts`

Specialized hook for tracking clicks on any element:

```typescript
const {
  trackClickEvent,         // Generic click tracking
  createClickHandler,      // Enhanced click handler
  trackButtonClick,        // Button-specific tracking
  trackLinkClick,          // Link-specific tracking
  trackNavigationClick,    // Navigation tracking
  trackModalAction,        // Modal interaction tracking
  trackTabClick,           // Tab switching tracking
  trackDropdownAction,     // Dropdown selection tracking
  trackFilterAction,       // Filter usage tracking
  trackSortAction,         // Sorting behavior tracking
  trackCardClick,          // Card interaction tracking
} = useClickTracking();
```

### 3. Enhanced Component Tracking

#### Feedback Form (`feedback-form.tsx`)
- Form submission tracking with success/error states
- Field-level interaction tracking
- File attachment tracking
- Form validation error tracking

#### Like Button (`like-button.tsx`)
- Like/unlike action tracking
- User authentication prompt tracking
- Content engagement metrics

#### Vote Button (`vote-button.tsx`)
- Vote/unvote action tracking
- Authentication flow tracking
- Voting behavior analytics

#### Comment Form (`comment-form.tsx`)
- Comment creation tracking
- Reply behavior tracking
- File attachment analytics
- Keyboard shortcut usage

#### Umami Analytics Component (`umami-analytics.tsx`)
- Enhanced user identification
- Improved page view tracking
- Better tenant/application context

## 📊 Analytics Event Types

### 1. User Interactions
- Click events with element, section, and value tracking
- Form interactions (focus, blur, submit, error)
- Navigation events (page changes, link clicks)
- Feature usage (which features are being used)

### 2. Content Analytics
- Feedback creation, viewing, sharing
- Comment interactions and replies
- Vote and reaction tracking
- Content engagement metrics

### 3. Performance Monitoring
- API call response times
- Page load performance
- Component render times
- Resource loading metrics

### 4. Error Tracking
- JavaScript errors with stack traces
- API call failures
- Network issues
- Validation errors

### 5. User Behavior
- Search queries and results
- Filter and sort usage
- Modal interactions
- Tab switching patterns

### 6. Enhanced User Properties
- Device type (desktop/mobile/tablet)
- Browser and OS information
- User type (admin/user/guest)
- Session tracking
- Geographic data
- Screen resolution
- Language preferences

## 🔧 Configuration

### Environment Variables

```env
VITE_UMAMI_APP_ID=your-umami-app-id
```

### Umami Host Configuration

Currently configured to use: `https://umami.paulgeorge.dev`

To change the host URL, update the `script.src` and `data-host-url` attributes in the `UmamiAnalytics` component.

### Development vs Production

- **Development**: Events are logged to console but not sent to Umami
- **Production**: Events are sent to Umami server
- Debug information is available in development mode

## 🎯 Implementation Examples

### Basic Event Tracking

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackClick, trackFeature } = useAnalytics();

  const handleButtonClick = () => {
    trackClick('cta-button', 'hero-section', 'sign-up');
    trackFeature('user-onboarding', 'cta-clicked');
  };

  return <button onClick={handleButtonClick}>Sign Up</button>;
}
```

### Form Tracking

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function ContactForm() {
  const { trackForm } = useAnalytics();

  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      trackForm('submit', 'contact-form');
    } catch (error) {
      trackForm('error', 'contact-form', undefined, error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        onFocus={() => trackForm('focus', 'contact-form', 'email')}
        onBlur={() => trackForm('blur', 'contact-form', 'email')}
      />
    </form>
  );
}
```

### Content Tracking

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function FeedbackCard({ feedback }) {
  const { trackContent } = useAnalytics();

  const handleView = () => {
    trackContent('feedback', 'view', feedback.id, feedback.title, {
      category: feedback.category,
      votes: feedback.votes,
      comments: feedback.comments,
    });
  };

  return <div onClick={handleView}>...</div>;
}
```

### API Call Tracking

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function DataFetcher() {
  const { trackApiCall } = useAnalytics();

  const fetchData = async () => {
    return await trackApiCall(
      () => fetch('/api/data').then(res => res.json()),
      '/api/data'
    );
  };

  return <button onClick={fetchData}>Load Data</button>;
}
```

## 📈 Analytics Dashboard Insights

With these enhancements, your Umami dashboard will now show:

### User Engagement Metrics
- Feature usage patterns
- Content interaction rates
- User journey flows
- Session duration and depth

### Performance Metrics
- API response times
- Page load performance
- Error rates and types
- User experience bottlenecks

### Content Analytics
- Most popular content types
- User-generated content trends
- Engagement by content category
- Comment and feedback patterns

### User Behavior
- Search query analysis
- Filter and sort preferences
- Navigation patterns
- Feature adoption rates

## 🚀 Next Steps

### 1. Additional Components to Enhance
- Navigation menu items
- Search components
- Modal dialogs
- Dropdown menus
- Tab components
- Card components
- Filter components

### 2. Advanced Analytics Features
- Funnel analysis
- Cohort tracking
- A/B testing support
- Custom event funnels
- User segmentation
- Heatmap integration

### 3. Integration Opportunities
- Connect with backend analytics
- Email campaign tracking
- Social media share tracking
- Download and export tracking
- Real-time analytics dashboard

## 🔧 Maintenance

### Regular Tasks
1. Monitor error rates in analytics
2. Review performance metrics
3. Analyze user behavior patterns
4. Update event tracking for new features
5. Clean up unused event types

### Debugging
- Check browser console for analytics logs in development
- Verify events are being sent to Umami in production
- Monitor for JavaScript errors in analytics code
- Test analytics in different browsers and devices

## 📚 Additional Resources

- [Umami Analytics Documentation](https://umami.is/docs)
- [Analytics Best Practices](https://umami.is/docs/guides/best-practices)
- [Custom Events Guide](https://umami.is/docs/guides/custom-events)

## 🎉 Benefits of Enhanced Analytics

1. **Better User Understanding**: Know exactly how users interact with your app
2. **Performance Monitoring**: Track and optimize slow API calls and pages
3. **Error Prevention**: Catch and fix issues before they affect users
4. **Feature Validation**: Understand which features are valuable to users
5. **Content Strategy**: Optimize content based on user engagement
6. **Technical Insights**: Monitor application health and performance

The enhanced analytics implementation provides comprehensive insights into user behavior, application performance, and content engagement, enabling data-driven decisions for product development and optimization.
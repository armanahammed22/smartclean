
'use client';

/**
 * @fileOverview Universal Marketing Tracking Utility
 * Handles browser-side Facebook Pixel and server-side CAPI event synchronization.
 */

declare global {
  interface Window {
    fbq: any;
  }
}

export type TrackingEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead';

interface TrackingPayload {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  user_data?: {
    email?: string;
    phone?: string;
  };
}

/**
 * Generates a unique event ID for deduplication between Pixel and CAPI
 */
export const generateEventId = () => {
  return 'evt_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

/**
 * Fires a browser-side Facebook Pixel event and triggers a server-side CAPI request
 */
export const trackEvent = async (eventName: TrackingEvent, payload: TrackingPayload = {}) => {
  const eventId = generateEventId();
  const currency = payload.currency || 'BDT';

  // 1. Browser-side Tracking (Pixel)
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, {
      ...payload,
      currency,
    }, { eventID: eventId });
  }

  // 2. Server-side Tracking (CAPI)
  // We send this to our internal proxy route to keep the Access Token secure
  try {
    fetch('/api/marketing/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        payload: {
          ...payload,
          currency,
        }
      }),
    });
  } catch (error) {
    console.warn('CAPI Tracking Failed:', error);
  }
};


'use client';

/**
 * @fileOverview Universal Meta (Facebook) Tracking Utility
 * Provides a unified interface for Meta Pixel (Browser) and Conversion API (Server).
 * 
 * Payload structure follows Meta standard:
 * - event_name: Standard Meta events (Purchase, AddToCart, etc.)
 * - event_time: Managed by the server
 * - event_id: Used for deduplication (Crucial for accuracy)
 * - user_data: Hashed PII (Email, Phone) + Client context
 * - custom_data: Transaction specific values
 */

declare global {
  interface Window {
    fbq: any;
  }
}

export type TrackingEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Lead' | 'Contact';

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
    external_id?: string;
  };
}

/**
 * Generates a unique event ID for deduplication between Pixel and CAPI
 * Mistake to avoid: Re-using the same ID for different events or missing it.
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

  // 1. Browser-side Tracking (Meta Pixel)
  // Meta Pixel handles browser-side hashing automatically
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, {
      ...payload,
      currency,
    }, { eventID: eventId });
  }

  // 2. Server-side Tracking (Conversion API via Proxy)
  // Send unhashed data to our secure proxy; proxy will hash it before Meta
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
          // Capture fbp and fbc for better match quality
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
        }
      }),
    });
  } catch (error) {
    console.warn('[CAPI] Sync Failed:', error);
  }
};

/** Helper to get cookies for fbp/fbc */
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

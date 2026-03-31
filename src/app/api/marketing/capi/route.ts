import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * Meta Conversion API (CAPI) Implementation
 * - Handles SHA-256 hashing of User Data
 * - Proxies payload to Meta Graph API
 * - Logs tracking success/failure to Firestore
 */

/** Hash PII data as per Meta requirements */
function hashData(data: string | undefined): string | null {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ status: 'Database not initialized' }, { status: 500 });
    }

    const { eventName, eventId, payload } = await req.json();

    // 1. Get Marketing Config
    const settingsSnap = await db.collection('site_settings').doc('marketing').get();
    const config = settingsSnap.data();

    if (!config?.trackingEnabled || !config?.pixelId || !config?.accessToken) {
      return NextResponse.json({ status: 'Tracking Disabled or Config Missing' });
    }

    // Dynamic API Version from Dashboard
    const apiVersion = config.apiVersion || 'v18.0';

    // 2. Prepare User Data (Server Side Hashing)
    const userData: any = {
      client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
      client_user_agent: req.headers.get('user-agent') || '',
      fbp: payload.fbp || null,
      fbc: payload.fbc || null,
    };

    if (payload.user_data?.email) {
      userData.em = [hashData(payload.user_data.email)];
    }
    if (payload.user_data?.phone) {
      // Ensure phone is in E.164 format (digits only)
      const cleanPhone = payload.user_data.phone.replace(/\D/g, '');
      userData.ph = [hashData(cleanPhone)];
    }
    if (payload.user_data?.external_id) {
      userData.external_id = [hashData(payload.user_data.external_id)];
    }

    // 3. Construct Meta Payload
    const fbPayload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: req.headers.get('referer') || '',
        user_data: userData,
        custom_data: {
          value: payload.value,
          currency: payload.currency || 'BDT',
          content_ids: payload.content_ids || [],
          content_type: payload.content_type || 'product',
          content_name: payload.content_name || '',
          content_category: payload.content_category || '',
        },
      }],
    };

    // 4. Send to Meta Graph API using Dynamic Version
    const fbResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${config.pixelId}/events?access_token=${config.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload),
      }
    );

    const result = await fbResponse.json();

    // 5. Audit Log
    await db.collection('tracking_logs').add({
      eventName,
      eventId,
      method: 'Server',
      status: fbResponse.ok ? 'Success' : 'Failed',
      metaResponse: result,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: fbResponse.ok, result });

  } catch (error: any) {
    console.error('[CAPI Proxy Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

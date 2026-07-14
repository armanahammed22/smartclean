import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * Meta Conversion API (CAPI) Implementation
 * - Handles SHA-256 hashing of User Data
 * - Proxies payload to Meta Graph API
 * - Logs tracking success/failure to Firestore with full error details
 */

/** Hash PII data as per Meta requirements */
function hashData(data: string | undefined): string | null {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ status: 'Database not available' }, { status: 200 });
    }

    const body = await req.json();
    const { eventName, eventId, payload } = body;

    // 1. Get Marketing & Global Config with graceful fail
    let config: any = null;
    let global: any = null;

    try {
      const [settingsSnap, globalSnap] = await Promise.all([
        db.collection('site_settings').doc('marketing').get(),
        db.collection('site_settings').doc('global').get()
      ]);
      
      config = settingsSnap.data();
      global = globalSnap.data();
    } catch (dbError: any) {
      console.warn('[CAPI Admin SDK Error]:', dbError.message);
      return NextResponse.json({ success: false, status: 'Permission Denied', error: dbError.message });
    }

    if (!config?.trackingEnabled || !config?.pixelId || !config?.accessToken) {
      return NextResponse.json({ status: 'Tracking Disabled or Config Missing' });
    }

    const apiVersion = config.apiVersion || 'v18.0';

    // 2. Prepare User Data (Cleaned and Hashed)
    const userData: any = {
      client_ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
      client_user_agent: req.headers.get('user-agent') || '',
    };

    if (payload.fbp) userData.fbp = payload.fbp;
    if (payload.fbc) userData.fbc = payload.fbc;

    if (payload.user_data?.email) {
      userData.em = [hashData(payload.user_data.email)];
    }
    if (payload.user_data?.phone) {
      const cleanPhone = payload.user_data.phone.replace(/\D/g, '');
      userData.ph = [hashData(cleanPhone)];
    }
    if (payload.user_data?.external_id) {
      userData.external_id = [hashData(payload.user_data.external_id)];
    }

    // 3. Prepare Custom Data (Only include defined values)
    const customData: any = {
      currency: payload.currency || 'BDT',
    };

    if (typeof payload.value === 'number') customData.value = payload.value;
    if (payload.content_ids && payload.content_ids.length > 0) customData.content_ids = payload.content_ids;
    if (payload.content_type) customData.content_type = payload.content_type;
    if (payload.content_name) customData.content_name = payload.content_name;
    if (payload.content_category) customData.content_category = payload.content_category;

    // 4. Construct Meta Payload
    const fbPayload = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: req.headers.get('referer') || global?.websiteUrl || '',
        user_data: userData,
        custom_data: customData,
      }],
    };

    // 5. Send to Meta Graph API
    const fbResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${config.pixelId}/events?access_token=${config.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload),
      }
    );

    const result = await fbResponse.json();

    // 6. Audit Log (Include full results for debugging)
    try {
      await db.collection('tracking_logs').add({
        eventName,
        eventId,
        method: 'Server',
        status: fbResponse.ok ? 'Success' : 'Failed',
        metaResponse: result,
        requestPayload: body,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}

    return NextResponse.json({ success: fbResponse.ok, result });

  } catch (error: any) {
    console.error('[CAPI Proxy Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 200 }); // Keep 200 to prevent noisy UI errors
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * Facebook Conversion API (CAPI) Proxy (Server-Side)
 * Uses Firebase Admin SDK for secure data logging and token retrieval.
 */
export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ status: 'Internal Error: DB Connection Missing' }, { status: 500 });
    }

    const { eventName, eventId, payload } = await req.json();

    // 1. Fetch Marketing Settings using Admin SDK
    const settingsSnap = await db.collection('site_settings').doc('marketing').get();
    const config = settingsSnap.data();

    if (!config?.trackingEnabled || !config?.pixelId || !config?.accessToken) {
      return NextResponse.json({ status: 'Tracking Disabled or Config Missing' });
    }

    // 2. Prepare User Data (Hashed)
    const userData: any = {
      client_ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
      client_user_agent: req.headers.get('user-agent') || '',
    };

    if (payload.user_data?.email) {
      userData.em = [crypto.createHash('sha256').update(payload.user_data.email.toLowerCase().trim()).digest('hex')];
    }
    if (payload.user_data?.phone) {
      userData.ph = [crypto.createHash('sha256').update(payload.user_data.phone.replace(/\D/g, '')).digest('hex')];
    }

    // 3. Construct Facebook Request
    const fbPayload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: req.headers.get('referer') || '',
          user_data: userData,
          custom_data: {
            value: payload.value,
            currency: payload.currency || 'BDT',
            content_ids: payload.content_ids,
            content_type: 'product',
            content_name: payload.content_name,
            content_category: payload.content_category,
          },
        },
      ],
    };

    // 4. Send to Facebook
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload),
      }
    );

    const result = await fbResponse.json();

    // 5. Log Event to Firestore using Admin SDK
    await db.collection('tracking_logs').add({
      eventName,
      eventId,
      platform: 'Facebook',
      method: 'Server',
      status: fbResponse.ok ? 'Success' : 'Failed',
      payload: fbPayload,
      response: result,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: fbResponse.ok, result });

  } catch (error: any) {
    console.error('CAPI Internal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

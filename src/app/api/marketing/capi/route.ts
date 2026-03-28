import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * Facebook Conversion API (CAPI) Proxy (Server-Side)
 * Using Admin SDK with robust error handling for missing connections.
 */
export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ status: 'Database not initialized' }, { status: 200 });
    }

    const { eventName, eventId, payload } = await req.json();

    const settingsSnap = await db.collection('site_settings').doc('marketing').get();
    const config = settingsSnap.data();

    if (!config?.trackingEnabled || !config?.pixelId || !config?.accessToken) {
      return NextResponse.json({ status: 'Tracking Disabled' });
    }

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
          content_ids: payload.content_ids,
          content_type: 'product',
        },
      }],
    };

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbPayload),
      }
    );

    const result = await fbResponse.json();

    await db.collection('tracking_logs').add({
      eventName,
      eventId,
      method: 'Server',
      status: fbResponse.ok ? 'Success' : 'Failed',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: fbResponse.ok, result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

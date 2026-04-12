
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * Isolated Webhook Handler for Social Media Messages
 * Handles incoming events from FB Messenger or WhatsApp.
 */
export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'DB not connected' }, { status: 503 });
    }

    const body = await req.json();
    
    // 1. Identify Provider (Simulation)
    const platform = body.object || 'whatsapp';
    const entries = body.entry || [];

    // 2. Process Messages
    for (const entry of entries) {
      const messaging = entry.messaging || [];
      for (const msgEvent of messaging) {
        const senderId = msgEvent.sender?.id;
        const text = msgEvent.message?.text;

        if (senderId && text) {
          // Log interaction to isolated collection
          await db.collection('social_agent_interactions').add({
            senderId,
            platform,
            message: text,
            timestamp: new Date().toISOString(),
            processed: false
          });
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Webhook Verification (Required for Meta Apps)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

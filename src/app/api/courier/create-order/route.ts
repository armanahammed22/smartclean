import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * Scalable Courier API Handler (Server-Side)
 * Using Admin SDK with connection safety.
 */
export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ 
        error: 'Service Unavailable: Database not connected' 
      }, { status: 503 });
    }

    const { orderId, courierId, orderData } = await req.json();
    
    if (!orderId || !courierId) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    // Fetch Courier Config
    const courierDoc = await db.collection('couriers').doc(courierId).get();
    if (!courierDoc.exists) {
      return NextResponse.json({ error: 'Courier Not Found' }, { status: 404 });
    }
    
    const config = courierDoc.data();
    let mapping = {};
    try {
      mapping = JSON.parse(config?.fieldMapping || '{}');
    } catch (e) {
      console.warn('Invalid mapping JSON');
    }

    const payload: any = {};
    Object.keys(mapping).forEach((apiKey) => {
      const internalKey = (mapping as any)[apiKey];
      payload[apiKey] = orderData[internalKey] || '';
    });

    const finalPayload = Object.keys(payload).length > 0 ? payload : orderData;

    const response = await fetch(config?.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config?.apiKey}`,
      },
      body: JSON.stringify({ order_id: orderId, ...finalPayload }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Courier API Error: ${errText}` }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: `Pushed to ${config?.name}`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

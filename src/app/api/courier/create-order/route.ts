
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * Scalable Courier API Handler (Server-Side)
 * Uses Firebase Admin SDK for secure Firestore access.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, courierId, orderData } = await req.json();
    
    if (!orderId || !courierId) {
      return NextResponse.json({ error: 'Missing Order ID or Courier ID' }, { status: 400 });
    }

    // 1. Fetch Courier Config using Admin SDK
    const courierDoc = await db.collection('couriers').doc(courierId).get();
    if (!courierDoc.exists) {
      return NextResponse.json({ error: 'Courier configuration not found' }, { status: 404 });
    }
    
    const config = courierDoc.data();
    if (!config) return NextResponse.json({ error: 'Invalid config' }, { status: 500 });
    
    // 2. Parse Dynamic Field Mapping
    let mapping = {};
    try {
      mapping = JSON.parse(config.fieldMapping || '{}');
    } catch (e) {
      console.warn('Invalid mapping JSON for courier', courierId);
    }

    // 3. Build Payload based on Mapping
    const payload: any = {};
    Object.keys(mapping).forEach((apiKey) => {
      const internalKey = (mapping as any)[apiKey];
      payload[apiKey] = orderData[internalKey] || '';
    });

    const finalPayload = Object.keys(payload).length > 0 ? payload : orderData;

    // 4. Execute API Call
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Api-Secret': config.apiSecret || '',
      },
      body: JSON.stringify({
        order_id: orderId,
        ...finalPayload
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Courier API Error: ${errText}` }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Order successfully pushed to ${config.name}`,
      courierResponse: result
    });

  } catch (error: any) {
    console.error('Courier Service Failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

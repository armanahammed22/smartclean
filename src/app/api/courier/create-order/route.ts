
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Scalable Courier API Handler
 * Dynamically maps order data to courier-specific APIs based on Firestore config.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, courierId, orderData } = await req.json();
    
    if (!orderId || !courierId) {
      return NextResponse.json({ error: 'Missing Order ID or Courier ID' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    if (!firestore) {
      return NextResponse.json({ error: 'Firestore services unavailable' }, { status: 500 });
    }

    // 1. Fetch Courier Config
    const courierDoc = await getDoc(doc(firestore, 'couriers', courierId));
    if (!courierDoc.exists()) {
      return NextResponse.json({ error: 'Courier configuration not found' }, { status: 404 });
    }
    
    const config = courierDoc.data();
    
    // 2. Parse Dynamic Field Mapping
    // Format: {"api_customer_name": "customerName", "api_address": "address"}
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

    // If mapping is empty, use raw order data as fallback
    const finalPayload = Object.keys(payload).length > 0 ? payload : orderData;

    // 4. Execute API Call
    console.log(`Forwarding Order ${orderId} to ${config.name} at ${config.apiEndpoint}`);
    
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

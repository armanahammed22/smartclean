'use client';

import { collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc, increment, getDoc, limit, orderBy } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Quotation } from '@/types';

/**
 * Generates the next quotation number based on settings.
 * Supports complex prefixes with slashes (e.g., QTN/SM/2026)
 */
export async function getNextQuotationNumber(db: Firestore): Promise<string> {
  try {
    const settingsRef = doc(db, 'site_settings', 'quotation');
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists() ? settingsSnap.data() : { prefix: 'QTN', lastNumber: 1000 };
    
    const prefix = settings.prefix || 'QTN';
    const nextNumber = (settings.lastNumber || 1000) + 1;
    
    // Update the counter in settings
    await setDoc(settingsRef, { lastNumber: nextNumber }, { merge: true });
    
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (e) {
    return `QTN-${Math.floor(Math.random() * 9000) + 1000}`;
  }
}

/**
 * Converts a Quotation to a Booking
 */
export async function convertQuotationToBooking(db: Firestore, quotation: Quotation): Promise<string> {
  try {
    const bookingData = {
      customerId: quotation.customerId || 'walk-in',
      customerName: quotation.customerInfo.name,
      customerPhone: quotation.customerInfo.phone,
      customerEmail: quotation.customerInfo.email,
      address: quotation.customerInfo.address,
      items: [
        ...quotation.items.map(i => ({ ...i, itemType: 'service' })),
        ...(quotation.addOns || []).map(a => ({ ...a, itemType: 'service' }))
      ],
      totalPrice: quotation.total,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      status: 'New',
      source: `quotation_${quotation.quoteNumber}`,
      createdAt: new Date().toISOString(),
      dateTime: quotation.issueDate, 
      timeSlot: 'Morning'
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    
    // Update quotation status
    await updateDoc(doc(db, 'quotations', quotation.id), {
      status: 'Converted',
      convertedTo: 'booking',
      convertedId: docRef.id,
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (e) {
    throw new Error('Failed to convert quotation to booking');
  }
}

/**
 * Converts a Quotation to an Invoice
 */
export async function convertQuotationToInvoice(db: Firestore, quotation: any): Promise<string> {
  try {
    const collName = 'invoices';
    
    // Get count for invoice number
    const countSnap = await getDocs(query(collection(db, collName)));
    const invNumber = `INV-QTN-${(countSnap.size + 1).toString().padStart(4, '0')}`;

    const invoiceData = {
      invoiceNumber: invNumber,
      quotationId: quotation.id,
      quoteRef: quotation.quoteNumber,
      customerId: quotation.customerId || null,
      customerInfo: quotation.customerInfo,
      items: [
        ...quotation.items.map((i: any) => ({ ...i, type: 'service' })),
        ...(quotation.addOns || []).map((a: any) => ({ ...a, type: 'addon' }))
      ],
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      discountType: quotation.discountType,
      additionalCharges: quotation.additionalCharges || 0,
      vatPercent: quotation.vatPercent || 0,
      tax: quotation.tax,
      total: quotation.total,
      paymentStatus: 'Unpaid',
      paidAmount: 0,
      dueAmount: quotation.total,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const docRef = await addDoc(collection(db, collName), invoiceData);
    
    // Update quotation status
    await updateDoc(doc(db, 'quotations', quotation.id), {
      status: 'Converted',
      convertedTo: 'invoice',
      convertedId: docRef.id,
      updatedAt: new Date().toISOString()
    });

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartclean.com.bd';
    const publicLink = `${baseUrl}/invoice/${invNumber}`;
    await updateDoc(docRef, { publicLink });

    return docRef.id;
  } catch (e) {
    console.error('Conversion Error:', e);
    throw new Error('Failed to convert quotation to invoice');
  }
}

/**
 * Downloads a quotation as PDF
 * Optimized for single-page export.
 */
export async function downloadQuotationPDF(elementId: string, fileName: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: 0,
    filename: `${fileName.replace(/\//g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      logging: false,
      letterRendering: true
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all'] } // Forces content to avoid breaking if possible
  };

  await html2pdf().from(element).set(opt).save();
}

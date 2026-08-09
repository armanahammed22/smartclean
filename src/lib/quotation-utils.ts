'use client';

import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, getDoc, limit, setDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Quotation } from '@/types';
import { getOrCreateInvoice } from './invoice-utils';

/**
 * Generates the next quotation number based on settings (Read Only).
 * It calculates the next number but does NOT update the DB.
 */
export async function getNextQuotationNumber(db: Firestore): Promise<string> {
  try {
    const settingsRef = doc(db, 'site_settings', 'quotation');
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists() ? settingsSnap.data() : { prefix: 'QTN', lastNumber: 1000 };
    
    const prefix = settings.prefix || 'QTN';
    const nextNumber = (settings.lastNumber || 1000) + 1;
    
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (e) {
    return `QTN-${Math.floor(Math.random() * 9000) + 1000}`;
  }
}

/**
 * Converts a Booking into a Quotation
 */
export async function convertBookingToQuotation(db: Firestore, booking: any): Promise<string> {
  const quoteNumber = await getNextQuotationNumber(db);
  const quotationData = {
    quoteNumber,
    customerId: booking.customerId || null,
    customerInfo: {
      name: booking.customerName,
      phone: booking.customerPhone,
      address: booking.address,
      email: booking.customerEmail || ''
    },
    items: booking.items?.map((item: any, idx: number) => ({
      id: item.id || `quote-item-${idx}-${Date.now()}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit || 'Qty',
      description: ''
    })) || [
      { id: booking.serviceId || 'gen', name: booking.serviceTitle, price: booking.totalPrice, quantity: 1, unit: 'Qty', description: '' }
    ],
    subtotal: booking.totalPrice,
    discount: 0,
    discountType: 'percentage',
    total: booking.totalPrice,
    status: 'Sent',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceBookingId: booking.id
  };

  // Increment last number in DB since we are creating it
  const settingsRef = doc(db, 'site_settings', 'quotation');
  await updateDoc(settingsRef, { lastNumber: increment(1) });

  const docRef = await addDoc(collection(db, 'quotations'), quotationData);
  return docRef.id;
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
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, collName), invoiceData);
    
    await updateDoc(doc(db, 'quotations', quotation.id), {
      status: 'Converted',
      convertedTo: 'invoice',
      convertedId: docRef.id,
      updatedAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (e) {
    throw new Error('Failed to convert quotation to invoice');
  }
}

/**
 * 🚀 HARD LOCKED A4 PDF GENERATION
 */
export async function downloadQuotationPDF(elementId: string, fileName: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: 0,
    filename: `${fileName.replace(/\//g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 1.0 },
    html2canvas: { 
      scale: 3,
      useCORS: true,
      letterRendering: true,
      scrollY: 0,
      windowWidth: 794
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: 'avoid-all' }
  };

  await html2pdf().from(element).set(opt).save();
}
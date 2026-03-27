
'use client';

import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types';

/**
 * Utility to generate Invoice from an Order or Booking
 */
export async function getOrCreateInvoice(db: Firestore, sourceId: string, type: 'order' | 'booking', sourceData: any): Promise<string> {
  const collName = 'invoices';
  const fieldName = type === 'order' ? 'orderId' : 'bookingId';
  
  // 1. Check if exists
  const q = query(collection(db, collName), where(fieldName, '==', sourceId));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    return snap.docs[0].id;
  }

  // 2. Generate new if not found
  const items: InvoiceItem[] = sourceData.items?.map((i: any) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
    type: i.itemType || 'product'
  })) || [];

  // Service specific items
  if (sourceData.package) {
    items.push({
      id: sourceData.package.id || 'pkg',
      name: `Package: ${sourceData.package.name}`,
      price: sourceData.package.price || 0,
      quantity: 1,
      type: 'package'
    });
  }

  if (sourceData.selectedAddOns?.length) {
    sourceData.selectedAddOns.forEach((a: any) => {
      items.push({
        id: a.id,
        name: `Add-on: ${a.name}`,
        price: a.price || 0,
        quantity: 1,
        type: 'addon'
      });
    });
  }

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = sourceData.tax || (subtotal * 0.08);
  const delivery = sourceData.deliveryCharge || sourceData.additionalCharge || 0;
  const discount = sourceData.discount || sourceData.couponDiscount || 0;
  const total = subtotal + tax + delivery - discount;

  const countQuery = query(collection(db, collName));
  const countSnap = await getDocs(countQuery);
  const invNumber = `INV-${(countSnap.size + 1).toString().padStart(4, '0')}`;

  const invoiceData: Omit<Invoice, 'id'> = {
    invoiceNumber: invNumber,
    [fieldName]: sourceId,
    customerInfo: {
      name: sourceData.customerName,
      phone: sourceData.customerPhone,
      email: sourceData.customerEmail,
      address: sourceData.address
    },
    items,
    subtotal,
    tax,
    discount,
    deliveryCharge: delivery,
    total,
    paymentStatus: sourceData.status === 'Delivered' || sourceData.status === 'Completed' ? 'Paid' : 'Unpaid',
    paymentMethod: sourceData.paymentMethod,
    paidAmount: 0,
    dueAmount: total,
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  const docRef = await addDoc(collection(db, collName), invoiceData);
  const publicLink = `${window.location.origin}/invoice/view/${docRef.id}`;
  await setDoc(doc(db, collName, docRef.id), { publicLink }, { merge: true });

  return docRef.id;
}

/**
 * PDF Generation Logic
 */
export async function downloadInvoicePDF(elementId: string, fileName: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: 0,
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().from(element).set(opt).save();
}

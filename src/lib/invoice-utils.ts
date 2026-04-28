'use client';

import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types';

/**
 * Utility to convert number to English Words
 */
export function numberToWords(amount: number): string {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return words[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return n.toString();
  };

  const integerPart = Math.floor(amount);
  if (integerPart === 0) return 'Zero Taka Only';
  
  return convert(integerPart) + ' Taka Only';
}

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
    type: i.itemType || 'product',
    unit: i.unit || 'Qty'
  })) || [];

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = 0; 
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
    paymentMethod: sourceData.paymentMethod || 'Cash',
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
 * PDF Generation Logic - Optimized for single page and clean breaks
 */
export async function downloadInvoicePDF(elementId: string, fileName: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: [10, 10, 10, 10], // Top, Left, Bottom, Right margin in mm
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false, 
      letterRendering: true,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().from(element).set(opt).save();
}

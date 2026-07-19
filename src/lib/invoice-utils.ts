'use client';

import { collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
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
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return n.toString();
  };

  const integerPart = Math.floor(amount);
  if (integerPart === 0) return 'Zero Taka Only';
  
  return convert(integerPart) + ' Taka Only';
}

/**
 * Utility to generate Invoice from an Order or Booking with Customer Management
 */
export async function getOrCreateInvoice(db: Firestore, sourceId: string, type: 'order' | 'booking', sourceData: any): Promise<string> {
  const collName = 'invoices';
  const fieldName = type === 'order' ? 'orderId' : 'bookingId';
  
  const q = query(collection(db, collName), where(fieldName, '==', sourceId));
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    return snap.docs[0].id;
  }

  // 1. Customer Auto-Management
  let customerId = sourceData.customerId || null;
  let previousDue = 0;

  if (!customerId && sourceData.customerPhone) {
    const custQuery = query(collection(db, 'users'), where('phone', '==', sourceData.customerPhone), where('role', '==', 'customer'));
    const custSnap = await getDocs(custQuery);
    if (!custSnap.empty) {
      const customerRecord = custSnap.docs[0];
      customerId = customerRecord.id;
      previousDue = customerRecord.data().outstandingBalance || 0;
    } else {
      // Auto-enroll new customer
      const newCustRef = doc(collection(db, 'users'));
      await setDoc(newCustRef, {
        uid: newCustRef.id,
        name: sourceData.customerName,
        phone: sourceData.customerPhone,
        address: sourceData.address,
        email: sourceData.customerEmail || '',
        role: 'customer',
        status: 'active',
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      customerId = newCustRef.id;
    }
  }

  const items: InvoiceItem[] = sourceData.items?.map((i: any) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
    type: i.itemType || 'product',
    unit: i.unit || 'Qty',
    subItems: i.subItems || []
  })) || [];

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = sourceData.tax || 0; 
  const delivery = sourceData.deliveryCharge || sourceData.additionalCharge || 0;
  const discount = sourceData.discount || sourceData.couponDiscount || 0;
  
  const currentInvoiceTotal = subtotal + tax + delivery - discount;
  const grandTotal = Number((currentInvoiceTotal + previousDue).toFixed(2));

  const countQuery = query(collection(db, collName));
  const countSnap = await getDocs(countQuery);
  const invNumber = `INV-${(countSnap.size + 1).toString().padStart(4, '0')}`;

  const isCompleted = sourceData.status === 'Delivered' || sourceData.status === 'Completed';
  const initialPaid = isCompleted ? grandTotal : 0;
  const initialDue = grandTotal - initialPaid;

  const invoiceData: any = {
    invoiceNumber: invNumber,
    [fieldName]: sourceId,
    customerId,
    customerInfo: {
      name: sourceData.customerName,
      phone: sourceData.customerPhone,
      email: sourceData.customerEmail,
      address: sourceData.address
    },
    items,
    currentAmount: currentInvoiceTotal,
    subtotal,
    tax,
    discount,
    deliveryCharge: delivery,
    previousDue,
    total: grandTotal,
    paymentStatus: initialDue <= 0 ? 'Paid' : initialPaid > 0 ? 'Partial' : 'Unpaid',
    paymentMethod: sourceData.paymentMethod || 'Cash',
    paidAmount: initialPaid,
    dueAmount: initialDue,
    paymentHistory: initialPaid > 0 ? [{
      id: 'pay_init_' + Date.now(),
      amount: initialPaid,
      date: new Date().toISOString(),
      method: sourceData.paymentMethod || 'Cash',
      notes: 'Initial Payment'
    }] : [],
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  const docRef = await addDoc(collection(db, collName), invoiceData);
  
  // 3. Update Customer Stats with atomic increments
  if (customerId) {
    await updateDoc(doc(db, 'users', customerId), {
      totalInvoiced: increment(currentInvoiceTotal),
      totalPaid: increment(initialPaid),
      outstandingBalance: increment(initialDue - previousDue),
      updatedAt: new Date().toISOString()
    });
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartclean.com.bd';
  const publicLink = `${baseUrl}/invoice/${invNumber}`;
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
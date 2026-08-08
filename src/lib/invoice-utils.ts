'use client';

import { collection, query, where, getDocs, addDoc, doc, setDoc, updateDoc, increment, getDoc, limit } from 'firebase/firestore';
import { Firestore, runTransaction } from 'firebase/firestore';
import { Invoice, InvoiceItem } from '@/types';

/**
 * Utility to convert number to English Words (Optimized for BDT)
 */
export function numberToWords(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Zero Taka Only';
  
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return words[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + words[n % 10] : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    return n.toString();
  };

  const integerPart = Math.floor(Math.abs(amount));
  if (integerPart === 0) return 'Zero Taka Only';
  
  return convert(integerPart) + ' Taka Only';
}

/**
 * Generates the next invoice number based on global settings.
 * Synchronized logic with Quotation.
 */
export async function getNextInvoiceNumber(db: Firestore): Promise<string> {
  try {
    const settingsRef = doc(db, 'site_settings', 'global');
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists() ? settingsSnap.data() : { invoicePrefix: 'INV', invoiceLastNumber: 1000 };
    
    const prefix = settings.invoicePrefix || 'INV';
    const nextNumber = (settings.invoiceLastNumber || 1000) + 1;
    
    // Update the counter in global settings
    await setDoc(settingsRef, { invoiceLastNumber: nextNumber }, { merge: true });
    
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (e) {
    return `INV-${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Utility to generate Invoice from an Order or Booking with Atomic Transaction Support
 */
export async function getOrCreateInvoice(db: Firestore, sourceId: string, type: 'order' | 'booking', sourceData: any, paidAmount: number = 0): Promise<string> {
  const collName = 'invoices';
  const fieldName = type === 'order' ? 'orderId' : 'bookingId';
  
  // 1. Check for existing invoice
  const q = query(collection(db, collName), where(fieldName, '==', sourceId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].id;

  // 2. Business Logic Calculations
  const items: InvoiceItem[] = sourceData.items?.map((i: any) => ({
    id: i.id || Math.random().toString(),
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
    type: i.itemType || 'product',
    unit: i.unit || 'Qty'
  })) || [];

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = sourceData.discount || 0;
  const delivery = sourceData.deliveryCharge || 0;
  const currentTotal = subtotal + delivery - discount;

  // 3. Get Next Invoice Number
  const invNumber = await getNextInvoiceNumber(db);

  // 4. Atomicity via Transactions
  let invoiceId = '';
  await runTransaction(db, async (transaction) => {
    let customerId = sourceData.customerId;
    let previousDue = 0;

    // Resolve or Enroll Customer
    if (!customerId && sourceData.customerPhone) {
      const cleanPhone = sourceData.customerPhone.replace(/\D/g, '');
      const custQuery = query(collection(db, 'users'), where('phone', '==', cleanPhone), limit(1));
      const custSnap = await getDocs(custQuery);
      
      if (!custSnap.empty) {
        customerId = custSnap.docs[0].id;
        previousDue = custSnap.docs[0].data().outstandingBalance || 0;
      } else {
        const newCustRef = doc(collection(db, 'users'));
        customerId = newCustRef.id;
        transaction.set(newCustRef, {
          uid: customerId,
          name: sourceData.customerName,
          phone: cleanPhone,
          address: sourceData.address,
          email: sourceData.customerEmail || '',
          role: 'customer',
          status: 'active',
          totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0,
          createdAt: new Date().toISOString()
        });
      }
    }

    const grandTotal = Number((currentTotal + previousDue).toFixed(2));
    const invRef = doc(collection(db, 'invoices'));
    invoiceId = invRef.id;

    const initialPaid = sourceData.status === 'Completed' ? grandTotal : paidAmount;
    const initialDue = Math.max(0, grandTotal - initialPaid);

    transaction.set(invRef, {
      invoiceNumber: invNumber,
      [fieldName]: sourceId,
      customerId,
      customerInfo: {
        name: sourceData.customerName,
        phone: sourceData.customerPhone,
        address: sourceData.address
      },
      items,
      subtotal,
      discount,
      deliveryCharge: delivery,
      previousDue,
      total: grandTotal,
      paidAmount: initialPaid,
      dueAmount: initialDue,
      paymentStatus: initialDue <= 0 ? 'Paid' : initialPaid > 0 ? 'Partial' : 'Unpaid',
      createdAt: new Date().toISOString()
    });

    if (customerId) {
      transaction.update(doc(db, 'users', customerId), {
        totalInvoiced: increment(currentTotal),
        totalPaid: increment(initialPaid),
        outstandingBalance: increment(initialDue - previousDue)
      });
    }
  });

  return invoiceId;
}

/**
 * PDF Generation Logic - Optimized for Single Page A4
 */
export async function downloadInvoicePDF(elementId: string, fileName: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: 0,
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      letterRendering: true,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().from(element).set(opt).save();
}
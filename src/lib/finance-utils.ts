'use client';

import { collection, addDoc, doc, updateDoc, increment, runTransaction, Firestore } from 'firebase/firestore';
import { LedgerEntry } from '@/types';

/**
 * Global Finance Ledger Utility
 * Safely creates a ledger entry and updates account balances.
 */
export async function createLedgerEntry(
  db: Firestore, 
  data: Omit<LedgerEntry, 'id' | 'createdAt'>
) {
  try {
    const ledgerRef = collection(db, 'finance_ledger');
    const entry = {
      ...data,
      createdAt: new Date().toISOString()
    };

    // Use transaction to ensure data integrity
    await runTransaction(db, async (transaction) => {
      // 1. Add Entry
      const newDocRef = doc(ledgerRef);
      transaction.set(newDocRef, entry);

      // 2. Update Account Balance if paid
      if (data.paidStatus === 'Paid' && data.accountId) {
        const accountRef = doc(db, 'finance_accounts', data.accountId);
        const amountChange = data.type === 'income' ? data.amount : -data.amount;
        transaction.update(accountRef, {
          balance: increment(amountChange)
        });
      }
    });

    return true;
  } catch (error) {
    console.error('[Finance Logic Error]:', error);
    throw error;
  }
}

/**
 * Auto-sync income from Order/Booking
 */
export async function syncOrderToLedger(db: Firestore, type: 'order' | 'booking', sourceData: any) {
  const accountId = 'default_cash'; // Fallback
  
  return createLedgerEntry(db, {
    type: 'income',
    category: type === 'order' ? 'Product Income' : 'Service Income',
    sourceId: sourceData.id,
    amount: sourceData.totalPrice || 0,
    paidStatus: 'Paid', // Assuming completed means paid
    date: new Date().toISOString(),
    accountId,
    notes: `Auto-sync from ${type} #${sourceData.id?.slice(0, 6)}`
  });
}

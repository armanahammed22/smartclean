'use client';

import { collection, doc, increment, runTransaction, Firestore } from 'firebase/firestore';
import { LedgerEntry } from '@/types';

/**
 * Global Finance Ledger Utility
 * Synchronizes Ledger entries with Account balances using Atomicity.
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

    // Use transaction to ensure balance and ledger are updated together
    await runTransaction(db, async (transaction) => {
      // 1. Create Ledger Document
      const newDocRef = doc(ledgerRef);
      transaction.set(newDocRef, entry);

      // 2. Update Account Balance if paid and account is selected
      if (data.paidStatus === 'Paid' && data.accountId) {
        const accountRef = doc(db, 'finance_accounts', data.accountId);
        
        // Income adds to balance, Expense deducts from balance
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
 * Auto-sync income from Order/Booking/Project completion
 */
export async function syncSourceToLedger(
  db: Firestore, 
  type: 'order' | 'booking' | 'project', 
  sourceId: string, 
  amount: number,
  accountId: string = 'default_cash',
  notes?: string
) {
  return createLedgerEntry(db, {
    type: 'income',
    category: type === 'order' ? 'Product Income' : type === 'booking' ? 'Service Income' : 'Partner Project / Commission',
    sourceId,
    amount,
    paidStatus: 'Paid',
    date: new Date().toISOString(),
    accountId,
    notes: notes || `Auto-sync from ${type} #${sourceId.slice(0, 6)}`
  });
}

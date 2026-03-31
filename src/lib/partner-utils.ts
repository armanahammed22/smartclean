'use client';

import { Firestore } from 'firebase/firestore';
import { createLedgerEntry } from './finance-utils';
import { Partner } from '@/types';

/**
 * Utility to calculate commission for a partner based on order/service value.
 */
export function calculatePartnerCommission(partner: Partner, orderValue: number): number {
  if (partner.commissionType === 'fixed') {
    return partner.commissionRate;
  }
  return (orderValue * partner.commissionRate) / 100;
}

/**
 * Auto-sync Partner Commission to Ledger
 */
export async function syncPartnerCommissionToLedger(
  db: Firestore,
  partner: Partner,
  sourceId: string,
  orderValue: number,
  notes?: string
) {
  const commissionAmount = calculatePartnerCommission(partner, orderValue);
  const type = partner.commissionDirection === 'TheyGiveMe' ? 'income' : 'expense';

  return createLedgerEntry(db, {
    type,
    category: 'Partner Commission',
    sourceId,
    partnerId: partner.id,
    amount: commissionAmount,
    paidStatus: 'Unpaid',
    date: new Date().toISOString(),
    accountId: 'default_cash', // Assuming default account
    notes: notes || `Commission for ${partner.name} - Source #${sourceId.slice(0,6)}`
  });
}

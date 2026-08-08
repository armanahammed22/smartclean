'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

// 🛡️ COMPREHENSIVE PROTECTED COLLECTIONS LIST
// Any collection NOT in this list that triggers a permission error will cause a fatal UI crash (Next.js Error Overlay).
// Admin/Sensitive collections should be in this list to ensure a graceful error handling.
const PROTECTED_COLLECTIONS = [
  'orders', 'bookings', 'leads', 'users', 'vendor_profiles', 
  'employee_profiles', 'staff_earnings', 'staff_availability',
  'tracking_logs', 'live_locations', 'roles_admins', 'roles_employees',
  'delivery_options', 'partner_projects', 'partners', 'finance_ledger',
  'finance_accounts', 'finance_staff_salaries', 'cleaning_projects',
  'work_entries', 'support_tickets', 'custom_requests', 'site_settings',
  'hero_banners', 'categories', 'subcategories', 'childcategories',
  'master_attributes', 'products', 'services', 'service_packages',
  'sub_services', 'advanced_offers', 'smart_pricing_rules', 'brands',
  'reusable_features', 'reusable_specs', 'variant_types', 'service_areas',
  'subscription_plans', 'offers', 'marketing_offers', 'top_nav_categories',
  'homepage_sections', 'custom_grid_modules', 'pages_management',
  'landing_pages', 'quick_actions', 'quick_links', 'campaigns',
  'invoices', 'coupons', 'team_members', 'attendance_logs',
  'expense_claims', 'leave_requests', 'quotations', 'payment_methods',
  'site_stats', 'product_qna', 'referrals', 'staff_salary_records',
  'payroll_records', 'document_design'
];

function extractPath(target: any): string {
  try {
    if (!target) return 'unknown';
    if (target.path) return target.path;
    if (target._query?.path?.segments) {
      return target._query.path.segments.join('/');
    }
  } catch (e) {}
  return 'query';
}

/**
 * Hardened collection hook with internal retry shield for internal SDK assertion failures (ca9/b815).
 * Forces a silent refresh if the watch stream encounters an internal SDK bug.
 */
export function useCollection<T = any>(
  memoizedTarget: ((CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean }) | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!memoizedTarget);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const activeToken = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!memoizedTarget) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentPath = extractPath(memoizedTarget);
    const token = Math.random().toString(36);
    activeToken.current = token;
    setIsLoading(true);

    let unsubscribe: (() => void) | null = null;

    const startListener = () => {
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
        unsubscribe = null;
      }

      try {
        unsubscribe = onSnapshot(
          memoizedTarget,
          (snapshot: QuerySnapshot<DocumentData>) => {
            if (activeToken.current !== token) return;
            const results = snapshot.docs.map(record => ({ ...(record.data() as T), id: record.id }));
            setData(results);
            setError(null);
            setIsLoading(false);
          },
          (err: any) => {
            if (activeToken.current !== token) return;

            const errorStr = (err.message || String(err)).toLowerCase();
            const errorCode = err.code;
            
            // 🛡️ SDK Resilience Shield: Detection of internal assertion IDs (b815, ca9)
            if (
              errorStr.includes('ca9') || 
              errorStr.includes('b815') || 
              errorStr.includes('assertion failed') || 
              errorStr.includes('unexpected state') ||
              errorStr.includes('persistent_stream') ||
              errorStr.includes('persistentlistenstream') ||
              errorStr.includes('fe":-1') ||
              errorStr.includes('fe": -1')
            ) {
              console.warn(`[Firestore Shield] Recovering from SDK assertion in collection: ${currentPath}. Triggering silent retry.`);
              
              if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = setTimeout(() => {
                if (activeToken.current === token) setRefreshKey(k => k + 1);
              }, 1500); 
              return;
            }

            if (errorCode === 'permission-denied') {
              const isProtected = PROTECTED_COLLECTIONS.some(pc => currentPath.toLowerCase().includes(pc.toLowerCase()));
              const contextualError = new FirestorePermissionError({ operation: 'list', path: currentPath });
              
              setError(contextualError);
              
              // Only emit to global listener if it's NOT in our protected fallback list
              if (!isProtected && currentPath !== 'query') {
                errorEmitter.emit('permission-error', contextualError);
              }
            } else {
              console.error(`[Firestore Error] ${currentPath}:`, err);
              setError(err);
            }
            
            setIsLoading(false);
          }
        );
      } catch (setupError: any) {
        const setupErrorStr = setupError.message.toLowerCase();
        if (setupErrorStr.includes('ca9') || setupErrorStr.includes('b815') || setupErrorStr.includes('unexpected state')) {
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            if (activeToken.current === token) setRefreshKey(k => k + 1);
          }, 2000);
        }
      }
    };

    startListener();

    return () => {
      activeToken.current = null;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [memoizedTarget, refreshKey]);

  return { data, isLoading, error };
}

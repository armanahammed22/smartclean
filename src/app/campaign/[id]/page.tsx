'use client';

import { redirect, useParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirecting to slug-based route to resolve Next.js routing conflict.
 * Folder src/app/campaign/[id] should be manually deleted.
 */
export default function LegacyCampaignRedirect() {
  const params = useParams();
  
  useEffect(() => {
    if (params.id) {
      redirect(`/campaign/${params.id}`);
    }
  }, [params.id]);

  return null;
}
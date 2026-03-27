
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * Dynamic Navbar Offer Slider
 * Cycles through active circular offers every 3 seconds.
 */
export function NavbarOfferSlider() {
  const db = useFirestore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Removed 'where' to avoid missing index errors, filtering in memory instead
    return query(
      collection(db, 'offers'),
      orderBy('order', 'asc')
    );
  }, [db]);

  const { data: allOffers, isLoading } = useCollection(offersQuery);

  // Filter active offers in memory
  const offers = useMemo(() => {
    return allOffers?.filter(o => o.isActive === true) || [];
  }, [allOffers]);

  useEffect(() => {
    if (!offers || offers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [offers]);

  if (isLoading || !offers || offers.length === 0) return null;

  const currentOffer = offers[currentIndex];

  return (
    <div className="flex items-center justify-center h-10 w-10 md:h-14 md:w-14 shrink-0 overflow-hidden">
      <Link 
        href={currentOffer.link || '#'} 
        className="block w-full h-full relative transition-all duration-500 animate-in fade-in zoom-in-90"
        key={currentOffer.id}
      >
        <div className="relative w-full h-full rounded-full border-2 border-primary/20 p-0.5 hover:border-primary transition-colors shadow-sm overflow-hidden">
          <Image
            src={currentOffer.image}
            alt="Offer"
            fill
            className="object-cover rounded-full"
            unoptimized
          />
        </div>
      </Link>
    </div>
  );
}


'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Custom Hook for Live Team Leader Tracking
 */
export function useTracking(bookingId: string | null, isTeamLeader: boolean, isActive: boolean) {
  const db = useFirestore();
  const [intervalTime, setIntervalTime] = useState(30);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    async function fetchInterval() {
      if (!db) return;
      const snap = await getDoc(doc(db, 'site_settings', 'tracking'));
      if (snap.exists()) setIntervalTime(snap.data().trackingInterval || 30);
    }
    fetchInterval();
  }, [db]);

  useEffect(() => {
    if (!db || !bookingId || !isTeamLeader || !isActive) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    // Success callback
    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      setDoc(doc(db, 'live_locations', bookingId), {
        latitude,
        longitude,
        lastUpdated: serverTimestamp(),
        bookingId
      }, { merge: true });
    };

    // Error callback
    const error = (err: GeolocationPositionError) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    // Start watching position
    watchId.current = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [db, bookingId, isTeamLeader, isActive]);

  return null;
}

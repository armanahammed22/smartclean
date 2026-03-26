
'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
  variant?: 'light' | 'dark';
}

export function CountdownTimer({ endDate, variant = 'light' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(endDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  const labels = [
    { val: timeLeft.d, label: 'D' },
    { val: timeLeft.h, label: 'H' },
    { val: timeLeft.m, label: 'M' },
    { val: timeLeft.s, label: 'S' }
  ];

  return (
    <div className="flex gap-1.5 md:gap-2">
      {labels.map((l, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`
            w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-md font-black text-[10px] md:text-sm
            ${variant === 'light' ? 'bg-white text-primary shadow-sm' : 'bg-[#081621] text-white'}
          `}>
            {l.val.toString().padStart(2, '0')}
          </div>
          <span className={`text-[8px] md:text-[10px] font-black uppercase ${variant === 'light' ? 'text-white/60' : 'text-gray-400'}`}>
            {l.label}
          </span>
          {i < labels.length - 1 && <span className={variant === 'light' ? 'text-white/30' : 'text-gray-200'}>:</span>}
        </div>
      ))}
    </div>
  );
}

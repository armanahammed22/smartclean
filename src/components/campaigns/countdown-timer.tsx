
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
    { val: timeLeft.d, label: 'Days' },
    { val: timeLeft.h, label: 'Hours' },
    { val: timeLeft.m, label: 'Mins' },
    { val: timeLeft.s, label: 'Secs' }
  ];

  return (
    <div className="flex gap-2">
      {labels.map((l, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`
            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg font-black text-xs md:text-sm
            ${variant === 'light' ? 'bg-white text-primary' : 'bg-[#081621] text-white shadow-xl'}
          `}>
            {l.val.toString().padStart(2, '0')}
          </div>
          <span className={`text-[7px] uppercase font-black tracking-widest mt-1 opacity-60 ${variant === 'light' ? 'text-white' : 'text-[#081621]'}`}>
            {l.label}
          </span>
        </div>
      ))}
    </div>
  );
}

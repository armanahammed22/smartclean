'use client';

import React from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, CreditCard, Share2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function CustomerDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'customer_profiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const STATS = [
    { label: "Active Bookings", value: "02", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Orders", value: "05", icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
    { label: "Wallet Balance", value: "৳0.00", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Affiliate Earnings", value: `৳${profile?.totalEarnings || 0}`, icon: Share2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.displayName}!</h1>
        <p className="text-muted-foreground text-sm">Manage your cleaning services and rewards in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className={cn("p-2 w-fit rounded-lg", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-sm font-bold flex justify-between items-center">
              Recent Bookings
              <Link href="/account/history" className="text-primary text-xs hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-12 text-center text-muted-foreground italic text-sm">
              No recent bookings found.
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><Share2 size={120} /></div>
          <CardContent className="p-8 space-y-4 relative z-10">
            <h3 className="text-xl font-black uppercase">Refer & Earn</h3>
            <p className="text-white/80 text-sm leading-relaxed">Share your code <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{profile?.referralCode}</span> with friends and get 10% commission on their first service booking!</p>
            <Button className="bg-white text-primary hover:bg-white/90 font-black" asChild>
              <Link href="/account/affiliate">Start Referring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

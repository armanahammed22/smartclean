
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, CreditCard, Share2, ArrowRight, Clock, Star, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => user ? query(collection(db, 'bookings'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(3)) : null, [db, user]);
  const { data: recentBookings } = useCollection(bookingsQuery);

  const ordersQuery = useMemoFirebase(() => user ? query(collection(db, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(3)) : null, [db, user]);
  const { data: recentOrders } = useCollection(ordersQuery);

  const STATS = [
    { label: "Active Bookings", value: recentBookings?.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Purchases", value: (recentBookings?.length || 0) + (recentOrders?.length || 0), icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
    { label: "Wallet Balance", value: "৳0", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Affiliate Earnings", value: `৳${profile?.totalEarnings || 0}`, icon: Share2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (!mounted) return (
    <div className="p-20 text-center">
      <Loader2 className="animate-spin text-primary mx-auto" size={40} />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Welcome, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground text-sm font-medium">Here's an overview of your cleaning services and rewards.</p>
        </div>
        <Button asChild className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20">
          <Link href="/services">Book a New Service</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className={cn("p-2.5 w-fit rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings List */}
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-6 px-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Latest Bookings</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold">Your scheduled services</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold gap-1 rounded-full h-8">
              <Link href="/account/history">All <ArrowRight size={14} /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings?.length ? (
              <div className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <div key={b.id} className="p-6 px-8 hover:bg-gray-50/30 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform"><Calendar size={20} /></div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{b.serviceTitle || 'Deep Cleaning'}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                          <Clock size={10} /> {b.dateTime ? format(new Date(b.dateTime), 'MMM dd, HH:mm') : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "text-[9px] font-black uppercase border-none px-2",
                      b.status === 'Completed' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center text-muted-foreground italic text-sm font-medium">
                No recent bookings found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refer & Earn Promo */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-primary text-white overflow-hidden relative rounded-[2rem]">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><Share2 size={120} /></div>
            <CardContent className="p-10 space-y-6 relative z-10">
              <div className="space-y-2">
                <Badge className="bg-white/20 text-white border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[10px]">Invite & Earn</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">Refer Friends,<br />Get Credit.</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed font-medium">Share your unique referral code <span className="font-mono bg-white/20 px-3 py-1 rounded-xl text-white">{profile?.referralCode}</span> and earn BDT 500 for every friend who books!</p>
              <Button className="bg-white text-primary hover:bg-white/90 font-black h-12 px-8 rounded-xl shadow-xl uppercase tracking-widest text-xs" asChild>
                <Link href="/account/affiliate">Start Referring</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2"><MapPin size={18} className="text-primary" /> Primary Address</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {profile?.address ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{profile.address}"</p>
                  <Button variant="outline" size="sm" asChild className="rounded-full h-8 font-bold text-[10px] uppercase border-primary/20 text-primary">
                    <Link href="/account/profile">Change Address</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground italic">No default address saved.</p>
                  <Button variant="outline" size="sm" asChild className="rounded-full h-8 font-bold text-[10px] uppercase border-primary/20 text-primary">
                    <Link href="/account/profile">Set Address</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

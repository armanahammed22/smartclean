
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, CreditCard, Share2, ArrowLeft, Clock, MapPin, Loader2, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminCustomerDashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id as string) : null, [db, id]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'bookings'), where('customerId', '==', id), orderBy('createdAt', 'desc'), limit(5)) : null, [db, id]);
  const { data: recentBookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);

  const ordersQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'orders'), where('customerId', '==', id), orderBy('createdAt', 'desc'), limit(5)) : null, [db, id]);
  const { data: recentOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const STATS = [
    { label: "Active Bookings", value: recentBookings?.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total History", value: (recentBookings?.length || 0) + (recentOrders?.length || 0), icon: ShoppingBag, color: "text-green-600", bg: "bg-green-50" },
    { label: "Wallet (Est)", value: "৳0", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Affiliate Earnings", value: `৳${profile?.totalEarnings || 0}`, icon: Share2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (profileLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Customer View...</p>
    </div>
  );

  if (!profile) return <div className="p-20 text-center text-muted-foreground italic">Customer profile not found.</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-tight">Viewing: {profile.name}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="text-primary" size={12} /> Administrative Oversight Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
          <User size={16} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">ID: {profile.uid.slice(0, 12)}...</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className={cn("p-2.5 w-fit rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Latest Bookings</CardTitle>
              <CardDescription className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mt-1">Client service schedule</CardDescription>
            </div>
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
                      "text-[9px] font-black uppercase border-none px-2 py-0.5 rounded-md",
                      b.status === 'Completed' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                    )}>
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-muted-foreground italic text-sm font-medium">
                No bookings recorded for this client.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Registered Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-sm text-gray-600 font-medium leading-relaxed">
                {profile.address ? `"${profile.address}"` : "No primary address registered."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Share2 size={120} /></div>
            <CardContent className="p-10 space-y-6 relative z-10">
              <div className="space-y-2">
                <Badge className="bg-white/20 text-white border-none uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[10px]">Affiliate Program</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">Partner Growth</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase opacity-60">Referral Code</p>
                  <p className="text-xl font-mono font-black">{profile.referralCode || 'N/A'}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase opacity-60">Total Earned</p>
                  <p className="text-xl font-black">৳{profile.totalEarnings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

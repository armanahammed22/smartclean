
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  PlayCircle, 
  Calendar, 
  Navigation, 
  Wallet, 
  Star,
  Activity,
  User,
  Phone,
  LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_ORDER = ['Assigned', 'On The Way', 'Service Started', 'Completed'];

export default function StaffDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const myBookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'bookings'),
      where('employeeId', '==', user.uid),
      orderBy('dateTime', 'asc')
    );
  }, [db, user]);

  const earningsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'staff_earnings'), where('staffId', '==', user.uid), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const availabilityRef = useMemoFirebase(() => user ? doc(db!, 'staff_availability', user.uid) : null, [db, user]);

  const { data: bookings, isLoading } = useCollection(myBookingsQuery);
  const { data: earnings } = useCollection(earningsQuery);
  const { data: availability } = useDoc(availabilityRef);

  const totalEarned = earnings?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const updateJobStatus = async (bookingId: string, currentStatus: string) => {
    if (!db) return;
    const nextIndex = STATUS_ORDER.indexOf(currentStatus) + 1;
    if (nextIndex >= STATUS_ORDER.length) return;
    
    const nextStatus = STATUS_ORDER[nextIndex];
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Job ${nextStatus}`, description: "Status updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Insufficient permissions." });
    }
  };

  const toggleOnline = async () => {
    if (!availabilityRef) return;
    const newState = !availability?.isOnline;
    await setDoc(availabilityRef, {
      isOnline: newState,
      uid: user?.uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
    toast({ title: newState ? "You are Online" : "You are Offline" });
  };

  if (!user) return <div className="p-8 text-center">Please login to view your portal.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Technician Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Field Operations & Performance</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={toggleOnline} 
            variant={availability?.isOnline ? "default" : "outline"}
            className={cn(
              "rounded-xl font-bold h-12 px-6 flex-1 md:flex-none gap-2 shadow-lg transition-all",
              availability?.isOnline ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-white"
            )}
          >
            <div className={cn("w-2 h-2 rounded-full animate-pulse", availability?.isOnline ? "bg-white" : "bg-red-500")} />
            {availability?.isOnline ? 'Active & Online' : 'Go Online'}
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl bg-white" asChild>
            <Link href="/staff/availability"><Calendar size={20} /></Link>
          </Button>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Jobs", val: bookings?.filter(b => b.status !== 'Completed').length || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Earnings", val: `৳${totalEarned}`, icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
          { label: "Career Jobs", val: earnings?.length || 0, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Rating", val: "4.9", icon: Star, color: "text-amber-600", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className={cn("p-2.5 w-fit rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight"><Activity className="text-primary" size={20} /> Your Active Schedule</h2>
            <Badge variant="outline" className="font-bold border-primary/20 text-primary uppercase text-[9px]">{bookings?.length || 0} Total</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="p-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-muted-foreground font-bold">Syncing Jobs...</span>
              </div>
            ) : bookings?.length ? (
              bookings.map((booking) => (
                <Card key={booking.id} className="border-none shadow-sm overflow-hidden bg-white rounded-3xl group hover:shadow-md transition-all border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-gray-900 uppercase leading-none">{booking.serviceTitle || 'General Service'}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <Clock size={14} className="text-primary" /> 
                            {booking.dateTime ? format(new Date(booking.dateTime), 'hh:mm a') : 'N/A'}
                            <span className="opacity-30">•</span>
                            <Badge variant="secondary" className="text-[9px] font-black px-2">{booking.status}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/5 text-primary rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                          <Navigation size={18} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <div className="p-1.5 bg-gray-100 rounded-lg"><User size={14} /></div>
                            {booking.customerName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground pl-1">
                            <MapPin size={14} className="text-primary" />
                            {booking.address || 'Sector 4, Uttara, Dhaka'}
                          </div>
                        </div>
                        <div className="flex items-end justify-end">
                          {booking.status !== 'Completed' ? (
                            <Button 
                              onClick={() => updateJobStatus(booking.id, booking.status)}
                              className="w-full md:w-auto h-11 px-8 rounded-xl font-black text-xs uppercase shadow-lg shadow-primary/20 gap-2"
                            >
                              {booking.status === 'Assigned' && <><Navigation size={14} /> Mark "On The Way"</>}
                              {booking.status === 'On The Way' && <><PlayCircle size={14} /> Start Service</>}
                              {booking.status === 'Service Started' && <><CheckCircle2 size={14} /> Complete Job</>}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-green-600 font-black text-xs uppercase tracking-widest bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                              <CheckCircle2 size={16} /> Job Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed flex flex-col items-center gap-4">
                <div className="p-6 bg-gray-50 rounded-full text-muted-foreground/30"><Calendar size={64} /></div>
                <div>
                  <p className="text-lg font-black text-gray-900 uppercase">No Jobs Today</p>
                  <p className="text-muted-foreground text-sm font-medium">Take some rest or update your availability.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Performance */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-[#081621] text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12"><Wallet size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-0">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary">Live Wallet</CardTitle>
            </CardHeader>
            <CardContent className="p-8 relative z-10 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/40">Total Commissions</p>
                <h3 className="text-4xl font-black tracking-tighter">৳{totalEarned.toLocaleString()}</h3>
              </div>
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold opacity-60 uppercase">Recent Payout</span>
                  <span className="font-black text-green-400">৳0.00</span>
                </div>
                <Button className="w-full bg-primary text-white hover:bg-primary/90 font-black h-12 rounded-xl shadow-xl uppercase tracking-widest text-xs">Withdraw Now</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-gray-50/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Phone size={16} className="text-primary" /> Support Hub</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">"Facing issues at a job site? Contact the operations manager immediately."</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-11 rounded-xl font-bold gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">Call Manager</Button>
                <Button variant="ghost" className="w-full h-11 rounded-xl font-bold gap-2 text-muted-foreground">Emergency Help</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

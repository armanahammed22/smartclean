
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, setDoc, serverTimestamp, addDoc, limit, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  FileText,
  Loader2,
  FileEdit,
  Zap,
  Crown,
  LogIn,
  LogOut,
  Camera,
  Map,
  TrendingUp,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { useTracking } from '@/hooks/use-tracking';

const STATUS_ORDER = ['Assigned', 'On The Way', 'Service Started', 'Completed'];

export default function StaffDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isSubmittingCheck, setIsSubmittingCheck] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedBookingForRequest, setSelectedBookingForRequest] = useState<any>(null);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // My Bookings
  const allBookingsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'bookings'), orderBy('dateTime', 'asc')) : null, [db]);
  const { data: allBookings, isLoading: bLoading } = useCollection(allBookingsQuery);

  const myBookings = useMemo(() => {
    return allBookings?.filter(b => b.assignedEmployees?.some((e: any) => e.uid === user?.uid)) || [];
  }, [allBookings, user]);

  // Attendance Check
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const attendanceRef = useMemoFirebase(() => user ? doc(db!, 'attendance_logs', `${user.uid}_${todayStr}`) : null, [db, user, todayStr]);
  const { data: todayAttendance, isLoading: aLoading } = useDoc(attendanceRef);

  const earningsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'staff_earnings'), where('staffId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
  }, [db, user]);

  const profileRef = useMemoFirebase(() => user ? doc(db!, 'employee_profiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const { data: earnings } = useCollection(earningsQuery);

  const activeJob = myBookings.find(b => b.status === 'Service Started' || b.status === 'On The Way');
  const isTeamLeader = activeJob?.teamLeaderId === user?.uid;
  const isTrackingActive = !!activeJob && isTeamLeader;

  useTracking(activeJob?.id || null, isTeamLeader, isTrackingActive);

  const handleAttendance = async (type: 'checkIn' | 'checkOut') => {
    if (!db || !user) return;
    setIsSubmittingCheck(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const payload: any = {
        staffId: user.uid,
        staffName: user.displayName || 'Technician',
        date: todayStr,
        updatedAt: serverTimestamp()
      };

      if (type === 'checkIn') {
        payload.checkIn = new Date().toISOString();
        payload.locationIn = { lat: position.coords.latitude, lng: position.coords.longitude };
        payload.status = 'Present';
      } else {
        payload.checkOut = new Date().toISOString();
        payload.locationOut = { lat: position.coords.latitude, lng: position.coords.longitude };
      }

      await setDoc(attendanceRef!, payload, { merge: true });
      toast({ title: type === 'checkIn' ? "Checked In Successfully" : "Checked Out Successfully", description: "Your presence has been recorded." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Location access required for attendance." });
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  const updateJobStatus = async (bookingId: string, currentStatus: string) => {
    if (!db || !user) return;
    const nextIndex = STATUS_ORDER.indexOf(currentStatus) + 1;
    if (nextIndex >= STATUS_ORDER.length) return;
    
    const nextStatus = STATUS_ORDER[nextIndex];
    try {
      const updateData: any = { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      };

      if (nextStatus === 'Service Started') {
        updateData.startTime = new Date().toISOString();
      }

      if (nextStatus === 'Completed') {
        updateData.endTime = new Date().toISOString();
        // Trigger automated commission/earning logic if hybrid
        if (profile?.salaryModel === 'hybrid') {
          const earningAmount = (activeJob?.totalPrice || 0) * (profile.commissionRate / 100);
          await addDoc(collection(db, 'staff_earnings'), {
            staffId: user.uid,
            bookingId,
            amount: earningAmount,
            type: 'Commission',
            status: 'Pending',
            createdAt: new Date().toISOString()
          });
        }
      }

      await updateDoc(doc(db, 'bookings', bookingId), updateData);
      toast({ title: `Status: ${nextStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (aLoading || bLoading) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-amber-600" size={48}/><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Duty Control...</p></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 bg-[#F9FAFB] min-h-screen">
      
      {/* 🚀 QUICK OPS BAR */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <div className="bg-[#081621] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg"><User size={32}/></div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-none">{user?.displayName || 'Technician'}</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Role: {profile?.role || 'Service Pro'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!todayAttendance?.checkIn ? (
                  <Button onClick={() => handleAttendance('checkIn')} disabled={isSubmittingCheck} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs shadow-lg gap-2">
                    <LogIn size={18} /> Clock In
                  </Button>
                ) : !todayAttendance?.checkOut ? (
                  <Button onClick={() => handleAttendance('checkOut')} disabled={isSubmittingCheck} className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-xs shadow-lg gap-2">
                    <LogOut size={18} /> Clock Out
                  </Button>
                ) : (
                  <Badge className="h-14 px-8 rounded-2xl bg-gray-100 text-gray-400 border-none font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={18}/> Duty Finished
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Check In", val: todayAttendance?.checkIn ? format(new Date(todayAttendance.checkIn), 'hh:mm a') : '--:--', icon: Clock, color: "text-emerald-600" },
                  { label: "My Rating", val: profile?.rating?.toFixed(1) || "5.0", icon: Star, color: "text-amber-500" },
                  { label: "Today Jobs", val: myBookings.filter(b => b.status === 'Completed').length, icon: TrendingUp, color: "text-blue-600" },
                  { label: "Wallet", val: `৳${earnings?.filter(e => e.status === 'Pending').reduce((a,c)=>a+c.amount, 0) || 0}`, icon: Wallet, color: "text-indigo-600" }
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-3xl border border-gray-100/50 space-y-1">
                    <div className={cn("p-1.5 w-fit rounded-lg mb-1", s.color)}><s.icon size={14}/></div>
                    <p className="text-[18px] font-black text-gray-900 leading-none">{s.val}</p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 📋 ACTIVE JOB LIST */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] px-2 flex items-center gap-2">
              <Activity className="text-primary" size={18} /> Active Dispatch Log
            </h3>
            {myBookings.length > 0 ? myBookings.map((booking) => (
              <Card key={booking.id} className={cn("border-none shadow-sm rounded-3xl overflow-hidden bg-white transition-all hover:shadow-md", booking.id === activeJob?.id && "ring-2 ring-primary shadow-xl")}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-4 rounded-2xl shrink-0 transition-colors", booking.id === activeJob?.id ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                        <Wrench size={24}/>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black uppercase tracking-tight text-gray-900">{booking.serviceTitle}</h4>
                          {booking.teamLeaderId === user.uid && <Badge className="bg-amber-100 text-amber-700 border-none px-2 py-0.5 text-[8px] font-black">LEADER</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                          <Clock size={12} className="text-primary" /> {format(new Date(booking.dateTime), 'PP p')}
                          <Badge variant="secondary" className="text-[8px] font-black ml-2 h-4 px-1.5 uppercase">{booking.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                      {booking.status !== 'Completed' ? (
                        <Button 
                          onClick={() => updateJobStatus(booking.id, booking.status)}
                          className="w-full md:w-auto h-11 px-8 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-primary/20"
                          disabled={booking.teamLeaderId !== user.uid || !todayAttendance?.checkIn}
                        >
                          {booking.status === 'Assigned' && "Start Transit"}
                          {booking.status === 'On The Way' && "Check In @ Site"}
                          {booking.status === 'Service Started' && "Finish & Finalize"}
                        </Button>
                      ) : (
                        <Badge className="bg-green-50 text-green-700 border-none font-black text-[10px] px-4 py-2 uppercase rounded-xl"><CheckCircle2 className="mr-2" size={14}/> JOB CLOSED</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase"><User size={14} /> {booking.customerName}</div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground pl-1"><MapPin size={14} className="text-primary" /> {booking.address}</div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full" asChild><a href={`tel:${booking.customerPhone}`}><Phone size={18}/></a></Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/5 text-primary rounded-full"><Map size={18}/></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
                <ShieldCheck size={48} className="text-gray-100" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Queue Clean. No Active Jobs.</p>
              </div>
            )}
          </div>
        </div>

        {/* 📊 EARNINGS SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                <History size={18} className="text-primary" /> Recent Pay Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {earnings?.length ? earnings.map((e) => (
                <div key={e.id} className="flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle2 size={14}/></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-900">{e.type}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{format(new Date(e.createdAt), 'MMM dd')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">+৳{e.amount}</p>
                    <Badge variant="outline" className="text-[7px] font-black h-4 px-1.5 uppercase border-none bg-gray-50">{e.status}</Badge>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center opacity-20"><Zap size={32} className="mx-auto"/><p className="text-[10px] font-black mt-2">NO RECORDS</p></div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-indigo-600 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><ShieldCheck size={120} /></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-widest">Operational Mode</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2"><span>Model</span><span>{profile?.salaryModel?.toUpperCase() || 'STANDARD'}</span></div>
                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2"><span>Shift</span><span>Full Day</span></div>
                <div className="flex justify-between text-xs font-bold"><span>Next Payout</span><span>{format(new Date(), 'MMMM 01')}</span></div>
              </div>
              <Button asChild className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                <Link href="/staff/availability">Update Availability</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

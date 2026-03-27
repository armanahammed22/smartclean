
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, setDoc, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
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
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  FileText,
  Loader2,
  FileEdit
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

const STATUS_ORDER = ['Assigned', 'On The Way', 'Service Started', 'Completed'];

export default function StaffDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedBookingForRequest, setSelectedBookingForRequest] = useState<any>(null);
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

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
  const profileRef = useMemoFirebase(() => user ? doc(db!, 'employee_profiles', user.uid) : null, [db, user]);

  const { data: bookings, isLoading } = useCollection(myBookingsQuery);
  const { data: earnings } = useCollection(earningsQuery);
  const { data: availability } = useDoc(availabilityRef);
  const { data: profile } = useDoc(profileRef);

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

      if (nextStatus === 'Completed') {
        await updateDoc(doc(db!, 'staff_availability', user!.uid), {
          status: 'Available',
          updatedAt: serverTimestamp()
        });
      }

      toast({ title: `Job ${nextStatus}`, description: "Status updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleRequestInvoiceUpdate = async (booking: any) => {
    if (!db) return;
    setSelectedBookingForRequest(booking);
    setIsRequestModalOpen(true);
  };

  const submitUpdateRequest = async () => {
    if (!db || !user || !selectedBookingForRequest) return;
    setIsSubmittingRequest(true);
    try {
      // 1. Ensure invoice exists
      const invId = await getOrCreateInvoice(db, selectedBookingForRequest.id, 'booking', selectedBookingForRequest);
      
      // 2. Add request
      await addDoc(collection(db, 'invoiceRequests'), {
        invoiceId: invId,
        staffId: user.uid,
        staffName: profile?.name || user.displayName || 'Technician',
        note: requestNote,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Request Sent", description: "Admin will review your price/service update." });
      setIsRequestModalOpen(false);
      setRequestNote('');
    } catch (e) {
      toast({ variant: "destructive", title: "Request Failed" });
    } finally {
      setIsSubmittingRequest(false);
    }
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
          <Select value={availability?.status || 'Offline'} onValueChange={(val) => setDoc(availabilityRef!, { status: val, isOnline: val !== 'Offline', updatedAt: serverTimestamp() }, { merge: true })}>
            <SelectTrigger className="h-12 w-full md:w-[180px] rounded-xl font-bold bg-green-600 text-white border-none shadow-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Busy">Busy (On Site)</SelectItem>
              <SelectItem value="Offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Jobs", val: bookings?.filter(b => b.status !== 'Completed').length || 0, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Earnings", val: `৳${totalEarned}`, icon: Wallet, color: "text-green-600", bg: "bg-green-50" },
          { label: "Career Jobs", val: earnings?.length || 0, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Rating", val: profile?.rating?.toFixed(1) || "5.0", icon: Star, color: "text-amber-600", bg: "bg-amber-50" }
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

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight"><Activity className="text-primary" size={20} /> Active Schedule</h2>
          <div className="grid grid-cols-1 gap-4">
            {bookings?.map((booking) => (
              <Card key={booking.id} className="border-none shadow-sm overflow-hidden bg-white rounded-3xl group hover:shadow-md transition-all border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-gray-900 uppercase leading-none">{booking.serviceTitle || 'General Service'}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Clock size={14} className="text-primary" /> {booking.dateTime ? format(new Date(booking.dateTime), 'hh:mm a') : 'N/A'}
                          <Badge variant="secondary" className="text-[9px] font-black px-2 uppercase tracking-widest ml-2">{booking.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full" onClick={() => handleRequestInvoiceUpdate(booking)}>
                          <FileEdit size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 bg-primary/5 text-primary rounded-full">
                          <Navigation size={18} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700"><User size={14} /> {booking.customerName}</div>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground pl-1"><MapPin size={14} className="text-primary" /> {booking.address}</div>
                      </div>
                      <div className="flex items-end justify-end">
                        {booking.status !== 'Completed' && (
                          <Button onClick={() => updateJobStatus(booking.id, booking.status)} className="w-full md:w-auto h-11 px-8 rounded-xl font-black text-xs uppercase shadow-lg shadow-primary/20">
                            {booking.status === 'Assigned' && "On The Way"}
                            {booking.status === 'On The Way' && "Start Service"}
                            {booking.status === 'Service Started' && "Complete Job"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase flex items-center gap-2">
              <FileEdit className="text-primary" /> Request Billing Change
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-1">
              <p className="text-[10px] font-black uppercase text-blue-900">Assigned Job</p>
              <p className="text-sm font-bold">{selectedBookingForRequest?.serviceTitle}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Reason for Update</Label>
              <Textarea 
                value={requestNote} 
                onChange={(e) => setRequestNote(e.target.value)} 
                placeholder="e.g. Added extra sofa for cleaning (+500 BDT)" 
                className="min-h-[120px] bg-gray-50 border-none rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRequestModalOpen(false)}>Cancel</Button>
            <Button onClick={submitUpdateRequest} disabled={isSubmittingRequest || !requestNote.trim()} className="font-black px-8">
              {isSubmittingRequest ? <Loader2 className="animate-spin h-4 w-4" /> : "Send to Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

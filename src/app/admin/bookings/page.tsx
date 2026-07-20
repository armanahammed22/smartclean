'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  FileText, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// 🚀 LAZY LOAD DIALOGS
const BookingAssignDialog = dynamic(() => import('@/components/admin/BookingAssignDialog').then(mod => mod.BookingAssignDialog), {
  ssr: false,
  loading: () => <Loader2 className="animate-spin text-primary" />
});

function BookingsListContent() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [assignBooking, setAssignBooking] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'), limit(100));
  }, [db, user]);

  const { data: bookings, isLoading } = useCollection(bookingsQuery);

  const stats = useMemo(() => {
    if (!bookings) return { total: 0, pending: 0, completed: 0, cancelled: 0 };
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'New' || b.status === 'Assigned').length,
      completed: bookings.filter(b => b.status === 'Completed').length,
      cancelled: bookings.filter(b => b.status === 'Cancelled').length
    };
  }, [bookings]);

  const filteredBookings = bookings?.filter(b => 
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.customerPhone?.includes(searchTerm)
  );

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bookings', id), { status });
    toast({ title: "Booking Updated" });
  };

  const handleOpenInvoice = async (booking: any) => {
    if (!db) return;
    setIsProcessingInvoice(booking.id);
    try {
      const invId = await getOrCreateInvoice(db, booking.id, 'booking', booking);
      router.push(`/admin/invoices/${invId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Invoice Error" });
    } finally {
      setIsProcessingInvoice(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Purge this booking record?")) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'bookings', id));
      toast({ title: "Record Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#081621]">Service Bookings</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage professional service schedules and technicians</p>
        </div>
        <Button asChild className="rounded-xl font-black gap-2 h-11 px-6 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
          <Link href="/admin/bookings/create"><Plus size={18} /> New Intake Page</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Recent Bookings", val: stats.total, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Unassigned", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Jobs Done", val: stats.completed, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Cancelled", val: stats.cancelled, icon: XCircle, bg: "bg-red-50", color: "text-red-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by customer or service..." 
              className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Service</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Customer</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Schedule</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filteredBookings?.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="font-black text-gray-900 text-xs uppercase">{booking.serviceTitle || 'General'}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {booking.assignedEmployees?.length > 0 ? (
                          <div className="flex -space-x-2">
                            {booking.assignedEmployees.map((e: any) => (
                              <div key={e.uid} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-black text-white border border-white" title={e.name}>
                                {e.name[0]}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-red-500 uppercase">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700 uppercase">{booking.customerName}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{booking.address}</div>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-gray-500">
                      {booking.dateTime ? format(new Date(booking.dateTime), 'MMM dd, HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={booking.status} onValueChange={(v) => handleUpdateStatus(booking.id, v)}>
                        <SelectTrigger className="h-8 text-[9px] font-black uppercase w-[110px] border-none bg-blue-50 text-blue-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['New', 'Assigned', 'On The Way', 'Service Started', 'Completed', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => setAssignBooking(booking)} title="Assign Team"><Users size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenInvoice(booking)} disabled={isProcessingInvoice === booking.id}><FileText size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(booking.id)} disabled={isSubmitting}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {assignBooking && (
        <BookingAssignDialog 
          booking={assignBooking} 
          isOpen={!!assignBooking} 
          onClose={() => setAssignBooking(null)} 
        />
      )}
    </div>
  );
}

export default function BookingsManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <BookingsListContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  User, 
  ClipboardList, 
  Trash2, 
  MapPin, 
  FileText, 
  Loader2, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Filter,
  Search
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOrCreateInvoice } from '@/lib/invoice-utils';

export default function BookingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'));
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
    b.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDownloadInvoice = async (booking: any) => {
    if (!db) return;
    setIsProcessingInvoice(booking.id);
    try {
      const invId = await getOrCreateInvoice(db, booking.id, 'booking', booking);
      router.push(`/admin/invoices/${invId}?download=true`);
    } catch (e) {
      toast({ variant: "destructive", title: "Download Error" });
    } finally {
      setIsProcessingInvoice(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBookings?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings?.map(b => b.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatus = async (status: string) => {
    if (!db || selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'bookings', id), { status });
      });
      await batch.commit();
      toast({ title: "Bulk Update Success", description: `${selectedIds.length} bookings updated.` });
      setSelectedIds([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Bulk Action Failed" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm("Remove selected booking logs?")) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'bookings', id));
      });
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Logs Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const STATUS_CONFIG: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700',
    'Assigned': 'bg-indigo-50 text-indigo-700',
    'In Progress': 'bg-amber-50 text-amber-700',
    'Completed': 'bg-green-50 text-green-700',
    'Cancelled': 'bg-red-50 text-red-700',
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase">Service Bookings</h1>
          <p className="text-muted-foreground text-sm">Schedule and track on-site appointments</p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Bookings", val: stats.total, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Pending Tasks", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Completed", val: stats.completed, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Cancelled", val: stats.cancelled, icon: XCircle, bg: "bg-red-50", color: "text-red-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by customer or service..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2 w-full sm:w-auto"><Filter size={18} /> Filters</Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#081621] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} SELECTED</span>
            <div className="h-6 w-px bg-white/20" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Completed')} disabled={isBulkProcessing} className="h-8 text-[10px] font-black uppercase">Mark Done</Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkStatus('Cancelled')} disabled={isBulkProcessing} className="h-8 text-[10px] font-black uppercase">Cancel Bulk</Button>
            </div>
          </div>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-white hover:bg-red-500 font-black uppercase text-[10px] h-8">
            <Trash2 size={14} className="mr-2" /> Delete
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={filteredBookings?.length ? selectedIds.length === filteredBookings.length : false}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold py-4 pl-4 uppercase text-[10px] tracking-widest">Service</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Customer</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Schedule</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredBookings?.map((booking) => (
                <TableRow key={booking.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(booking.id) && "bg-primary/5")}>
                  <TableCell className="pl-6">
                    <Checkbox 
                      checked={selectedIds.includes(booking.id)}
                      onCheckedChange={() => toggleSelect(booking.id)}
                    />
                  </TableCell>
                  <TableCell className="py-4 pl-4 font-black text-gray-900 text-xs uppercase">
                    {booking.serviceTitle || 'General Service'}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-700 uppercase">{booking.customerName}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{booking.address}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] font-bold uppercase text-gray-500">
                      {booking.dateTime ? format(new Date(booking.dateTime), 'MMM dd, hh:mm a') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[8px] font-black uppercase border-none px-2", STATUS_CONFIG[booking.status] || "bg-gray-50")}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary" 
                        onClick={() => handleOpenInvoice(booking)}
                        disabled={isProcessingInvoice === booking.id}
                        title="View Invoice"
                      >
                        {isProcessingInvoice === booking.id ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText size={16} />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-indigo-600" 
                        onClick={() => handleDownloadInvoice(booking)}
                        disabled={isProcessingInvoice === booking.id}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-none">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/admin/bookings/${booking.id}`)}>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-destructive" onClick={() => deleteDoc(doc(db!, 'bookings', booking.id))}>Delete Log</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

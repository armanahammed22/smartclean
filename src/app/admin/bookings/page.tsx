
'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
import { Calendar, Clock, User, ClipboardList, Trash2, MapPin, FileText, Loader2, MoreVertical } from 'lucide-react';
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

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'));
  }, [db, user]);

  const { data: bookings, isLoading } = useCollection(bookingsQuery);

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

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4 pl-8 uppercase text-[10px]">Service</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Customer</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Schedule</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : bookings?.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4 pl-8 font-black text-gray-900 text-xs">
                    {booking.serviceTitle || 'General Service'}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-700">{booking.customerName}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{booking.address}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] font-bold">
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
                      >
                        {isProcessingInvoice === booking.id ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText size={16} />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={16}/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => handleOpenInvoice(booking)}>View Invoice</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => handleDownloadInvoice(booking)}>Download PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-destructive">Delete Booking</DropdownMenuItem>
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

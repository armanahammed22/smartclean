'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { Calendar, Clock, User, ClipboardList, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BookingsPage() {
  const db = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'));
  }, [db]);

  const { data: bookings, isLoading } = useCollection(bookingsQuery);

  const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
    'Pending': { label: 'PENDING', color: 'bg-orange-100 text-orange-700' },
    'Assigned': { label: 'ASSIGNED', color: 'bg-blue-100 text-blue-700' },
    'In Progress': { label: 'IN PROGRESS', color: 'bg-primary/20 text-primary font-bold' },
    'Completed': { label: 'COMPLETED', color: 'bg-green-100 text-green-700' },
    'Cancelled': { label: 'CANCELLED', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground text-sm">Schedule and track service appointments</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2">
             <Calendar size={18} /> Calendar View
           </Button>
           <Button className="gap-2 font-bold">
             <ClipboardList size={18} /> Manual Booking
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase">Pending Today</p>
              <h3 className="text-3xl font-black mt-1">08</h3>
            </div>
            <Clock size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Assigned Jobs</p>
              <h3 className="text-3xl font-black mt-1">14</h3>
            </div>
            <User size={40} className="text-blue-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Revenue Forecast</p>
              <h3 className="text-3xl font-black mt-1">৳42,500</h3>
            </div>
            <ClipboardList size={40} className="text-green-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Service Details</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Date & Time</TableHead>
                <TableHead className="font-bold">Assigned Staff</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">Loading appointments...</TableCell>
                </TableRow>
              ) : bookings?.length ? (
                bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-900">{booking.serviceId}</div>
                      <div className="text-[10px] text-primary font-black">ID: {booking.id.slice(0, 8).toUpperCase()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{booking.customerId || 'Direct Client'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm font-semibold">{format(new Date(booking.dateTime), 'MMM dd, yyyy')}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(booking.dateTime), 'hh:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">
                          <User size={12} />
                        </div>
                        <span className="text-sm font-medium">{booking.employeeId || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none",
                        STATUS_CONFIG[booking.status]?.color || "bg-gray-100 text-gray-700"
                      )}>
                        {STATUS_CONFIG[booking.status]?.label || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" className="text-primary gap-1 font-bold text-xs">
                        Details <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic text-sm">
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

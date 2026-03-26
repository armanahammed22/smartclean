'use client';

import React, { useState } from 'react';
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
import { Calendar, Clock, User, ClipboardList, ChevronRight, Trash2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BookingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'));
  }, [db, user]);

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'employee_profiles'), orderBy('name', 'asc'));
  }, [db, user]);

  const { data: bookings, isLoading } = useCollection(bookingsQuery);
  const { data: employees } = useCollection(employeesQuery);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bookings', id), { status });
    toast({ title: "Booking Updated", description: `Status changed to ${status}` });
  };

  const handleAssignStaff = async (id: string, employeeId: string) => {
    if (!db) return;
    const employee = employees?.find(e => e.id === employeeId);
    await updateDoc(doc(db, 'bookings', id), { 
      employeeId, 
      employeeName: employee?.name || 'Assigned Staff',
      status: 'Assigned'
    });
    toast({ title: "Staff Assigned", description: `Job assigned to ${employee?.name}` });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this booking?")) return;
    await deleteDoc(doc(db, 'bookings', id));
    toast({ title: "Booking Removed" });
  };

  const STATUS_CONFIG: Record<string, { label: string, color: string }> = {
    'New': { label: 'NEW', color: 'bg-blue-50 text-blue-700' },
    'Assigned': { label: 'ASSIGNED', color: 'bg-indigo-50 text-indigo-700' },
    'In Progress': { label: 'IN PROGRESS', color: 'bg-primary/10 text-primary font-bold' },
    'Completed': { label: 'COMPLETED', color: 'bg-green-50 text-green-700' },
    'Cancelled': { label: 'CANCELLED', color: 'bg-red-50 text-red-700' },
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Service Bookings</h1>
          <p className="text-muted-foreground text-sm">Schedule and track on-site maintenance appointments</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <Button variant="outline" className="flex-1 md:flex-none gap-2"><Calendar size={18} /> Schedule</Button>
           <Button className="flex-1 md:flex-none gap-2 font-bold"><ClipboardList size={18} /> Manual</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-[10px] font-bold uppercase tracking-wider">Pending Jobs</p>
              <h3 className="text-2xl font-black mt-1">
                {bookings?.filter(b => b.status === 'New').length || 0}
              </h3>
            </div>
            <Clock size={32} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Active Today</p>
              <h3 className="text-2xl font-black mt-1">
                {bookings?.filter(b => b.status === 'In Progress').length || 0}
              </h3>
            </div>
            <User size={32} className="text-blue-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white sm:col-span-2 md:col-span-1">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Completed Total</p>
              <h3 className="text-2xl font-black mt-1">
                {bookings?.filter(b => b.status === 'Completed').length || 0}
              </h3>
            </div>
            <ClipboardList size={32} className="text-green-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-bold py-4 pl-8">Service Details</TableHead>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Schedule</TableHead>
                  <TableHead className="font-bold">Assign Staff</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20">Loading appointments...</TableCell></TableRow>
                ) : bookings?.length ? (
                  bookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 pl-8">
                        <div className="font-bold text-gray-900 leading-tight">
                          {booking.items?.[0]?.name || 'Deep Cleaning'}
                        </div>
                        <div className="text-[10px] text-primary font-black mt-1 uppercase">ID: {booking.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{booking.customerName}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} /> {booking.address?.slice(0, 20)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold">{booking.dateTime ? format(new Date(booking.dateTime), 'MMM dd, yyyy') : 'N/A'}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{booking.timeSlot || 'Morning'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={booking.employeeId} onValueChange={(val) => handleAssignStaff(booking.id, val)}>
                          <SelectTrigger className="h-8 text-xs font-medium w-[150px] bg-gray-50 border-none">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={booking.status} onValueChange={(val) => handleUpdateStatus(booking.id, val)}>
                          <SelectTrigger className={cn(
                            "h-8 text-[9px] font-black uppercase w-[120px]",
                            STATUS_CONFIG[booking.status]?.color
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Assigned">Assigned</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(booking.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground">No bookings found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

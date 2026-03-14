'use client';

import React from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, CheckCircle2, PlayCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const { data: bookings, isLoading } = useCollection(myBookingsQuery);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status: newStatus });
      toast({ title: "Status Updated", description: `Job marked as ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    }
  };

  if (!user) return <div className="p-8 text-center">Please login to view your schedule.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Daily Schedule</h1>
          <p className="text-muted-foreground text-sm">Today is {format(new Date(), 'EEEE, MMM dd')}</p>
        </div>
        <Badge className="bg-primary text-white py-1 px-3">STAFF</Badge>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <p className="text-center py-10">Loading your jobs...</p>
        ) : bookings?.length ? (
          bookings.map((booking) => (
            <Card key={booking.id} className="border-none shadow-sm overflow-hidden border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">{booking.serviceTitle || booking.serviceId}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock size={14} /> {format(new Date(booking.dateTime), 'hh:mm a')}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-primary" />
                        <span className="font-medium">{booking.customerName || 'Direct Client'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">Sector 4, Uttara, Dhaka</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between items-end gap-4">
                    <Badge className={cn(
                      "font-bold uppercase text-[10px]",
                      booking.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {booking.status}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {booking.status === 'Assigned' && (
                        <Button size="sm" className="gap-2" onClick={() => updateStatus(booking.id, 'In Progress')}>
                          <PlayCircle size={16} /> Start Job
                        </Button>
                      )}
                      {booking.status === 'In Progress' && (
                        <Button size="sm" variant="outline" className="gap-2 border-green-500 text-green-600" onClick={() => updateStatus(booking.id, 'Completed')}>
                          <CheckCircle2 size={16} /> Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
            <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground italic">No jobs assigned to you for today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
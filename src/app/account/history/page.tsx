
'use client';

import React from 'react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HistoryPage() {
  const { user } = useUser();
  const db = useFirestore();

  const bookingsQuery = useMemoFirebase(() => user ? query(collection(db, 'bookings'), where('customerId', '==', user.uid), orderBy('dateTime', 'desc')) : null, [db, user]);
  const ordersQuery = useMemoFirebase(() => user ? query(collection(db, 'orders'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user]);

  const { data: bookings, isLoading: bLoading } = useCollection(bookingsQuery);
  const { data: orders, isLoading: oLoading } = useCollection(ordersQuery);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground text-sm">Review your past cleaning services and product purchases.</p>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-xl">
          <TabsTrigger value="bookings" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Calendar size={16} /> Service Bookings
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShoppingBag size={16} /> Product Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Service</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin inline mr-2" /> Loading...</TableCell></TableRow>
                ) : bookings?.length ? (
                  bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-bold">{b.serviceTitle || 'Deep Cleaning'}</TableCell>
                      <TableCell className="text-xs">{format(new Date(b.dateTime), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-black text-primary">৳{b.totalPrice?.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{b.status}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No bookings found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Order ID</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {oLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="animate-spin inline mr-2" /> Loading...</TableCell></TableRow>
                ) : orders?.length ? (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="text-xs">{format(new Date(o.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-black text-primary">৳{o.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{o.status}</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">No orders found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

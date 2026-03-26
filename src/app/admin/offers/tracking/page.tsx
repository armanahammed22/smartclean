'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TicketPercent, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function CouponTrackingPage() {
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)) : null, [db]);
  const { data: orders, isLoading } = useCollection(ordersQuery);

  const couponOrders = orders?.filter(o => o.couponCode) || [];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Coupon Usage Tracking</h1>
        <p className="text-muted-foreground text-sm font-medium">Monitor performance and ROI of your discount campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Total Redemptions</p>
              <h3 className="text-3xl font-black mt-1">{couponOrders.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TicketPercent size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Total Discounted</p>
              <h3 className="text-3xl font-black mt-1">৳{couponOrders.reduce((acc, o) => acc + (o.couponDiscount || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingUp size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase">Revenue via Promo</p>
              <h3 className="text-3xl font-black mt-1">৳{couponOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/10 rounded-xl"><BarChart3 size={24} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-gray-50/50 border-b p-8">
          <CardTitle className="text-base font-bold uppercase tracking-tight">Recent Coupon Conversions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[9px] tracking-widest">Order ID</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Promo Code</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Savings</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : couponOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-5 pl-8">
                    <span className="font-bold text-gray-900 text-xs">#ORD-{order.id.slice(0, 6)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase">{order.couponCode}</Badge>
                  </TableCell>
                  <TableCell className="font-black text-red-600 text-xs">-৳{order.couponDiscount?.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-green-50 text-green-700 text-[8px] font-black uppercase">Converted</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8 text-[10px] font-bold text-gray-400">
                    {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
              {couponOrders.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No coupon redemptions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

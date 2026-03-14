
'use client';

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Search, Filter, ShoppingCart, FileText, Package, Truck, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function OrdersManagementPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const ordersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  const STATUS_COLORS: Record<string, string> = {
    'Pending': 'bg-gray-100 text-gray-700',
    'Processing': 'bg-blue-100 text-blue-700',
    'Shipped': 'bg-purple-100 text-purple-700',
    'Delivered': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground text-sm">Track and fulfill product sales</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold"><Truck size={18} /> Batch Ship</Button>
           <Button className="gap-2 font-bold"><ShoppingCart size={18} /> POS Order</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by Order ID or Customer Name..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4 text-xs uppercase tracking-wider">Order Details</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Customer</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Payment</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">Loading orders...</TableCell></TableRow>
              ) : filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-900">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : 'Date N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{order.customerName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black">৳{order.totalAmount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold border-none",
                        order.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      )}>
                        {order.paymentStatus || 'UNPAID'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none",
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                      )}>
                        {order.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Invoice">
                            <FileText size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Tracking">
                            <Truck size={16} />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic">No orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

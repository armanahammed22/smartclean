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
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  FileText, 
  Truck, 
  MoreVertical, 
  Trash2,
  Eye,
  CheckCircle2
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OrdersManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast({ title: "Order Updated", description: `Status changed to ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast({ title: "Order Deleted" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200',
    'Processing': 'bg-amber-50 text-amber-700 border-amber-200',
    'Shipped': 'bg-purple-50 text-purple-700 border-purple-200',
    'Delivered': 'bg-green-50 text-green-700 border-green-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground text-sm">Track and fulfill product sales in real-time</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold"><Truck size={18} /> Courier Sync</Button>
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
                <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Loading orders...</TableCell></TableRow>
              ) : filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-900">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{order.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-primary">৳{(order.totalPrice || order.totalAmount || 0).toLocaleString()}</div>
                      <Badge variant="outline" className="text-[8px] font-bold border-none bg-gray-50 mt-1">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                        <SelectTrigger className={cn(
                          "h-8 text-[9px] font-black uppercase w-[120px]",
                          STATUS_COLORS[order.status]
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Shipped">Shipped</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedOrder(order)}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteOrder(order.id)}>
                            <Trash2 size={16} />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              Order Details: #ORD-{selectedOrder?.id?.slice(0, 6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Customer Info</h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{selectedOrder?.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder?.customerPhone}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder?.address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Summary</h4>
                <div className="space-y-1">
                  <p className="text-xs font-bold">Payment: {selectedOrder?.paymentMethod}</p>
                  <p className="text-xs font-bold text-primary">Total: ৳{selectedOrder?.totalPrice?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Items Ordered</h4>
              <div className="space-y-2">
                {selectedOrder?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs font-bold">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder?.notes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-black uppercase text-amber-700 mb-1">Customer Notes</p>
                <p className="text-xs text-amber-900 italic">"{selectedOrder.notes}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
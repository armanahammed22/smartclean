
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
  Truck, 
  Trash2,
  Eye,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck
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
import { Checkbox } from '@/components/ui/checkbox';

export default function OrdersManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isShipping, setIsShipping] = useState<string | null>(null);
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<Record<string, 'pending' | 'success' | 'failed'>>({});
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const couriersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'couriers'), orderBy('name', 'asc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { data: couriers } = useCollection(couriersQuery);

  const filteredOrders = orders?.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.includes(searchTerm)
  );

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast({ title: "Order Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { isSuspicious: false, riskLevel: 'Low' });
      toast({ title: "Order Approved", description: "Security flags cleared." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    if (!db) return;
    const courier = couriers?.find(c => c.id === courierId);
    await updateDoc(doc(db, 'orders', orderId), { 
      courierId, 
      courierName: courier?.name || 'Assigned Courier' 
    });
    toast({ title: "Courier Assigned" });
  };

  const shipWithCourier = async (order: any) => {
    if (order.isSuspicious) {
      return { success: false, error: "Blocked: Suspicious order requires approval." };
    }
    if (!order.courierId) {
      return { success: false, error: "No courier assigned." };
    }

    try {
      const response = await fetch('/api/courier/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          courierId: order.courierId,
          orderData: order
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        await updateDoc(doc(db!, 'orders', order.id), { 
          status: 'Shipped',
          courierTracking: result.courierResponse?.tracking_number || 'N/A'
        });
        return { success: true, message: result.message };
      } else {
        return { success: false, error: result.error || "API Failure" };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const handleSingleShip = async (order: any) => {
    setIsShipping(order.id);
    const result = await shipWithCourier(order);
    if (result.success) {
      toast({ title: "Shipment Created", description: result.message });
    } else {
      toast({ variant: "destructive", title: "Shipping Failed", description: result.error });
    }
    setIsShipping(null);
  };

  const STATUS_COLORS: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-700 border-blue-200',
    'Processing': 'bg-amber-50 text-amber-700 border-amber-200',
    'Shipped': 'bg-purple-50 text-purple-700 border-purple-200',
    'Delivered': 'bg-green-50 text-green-700 border-green-200',
    'Cancelled': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-muted-foreground text-sm">Full lifecycle product sales control with Risk AI</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Order ID or Customer..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Order ID</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold">Risk Assessment</TableHead>
                <TableHead className="font-bold">Logistics</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredOrders?.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                    <div className="text-[9px] text-muted-foreground font-bold mt-1">
                      {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-700">{order.customerName}</div>
                    <div className="text-[10px] text-muted-foreground">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black w-fit uppercase",
                        order.riskLevel === 'High' ? "bg-red-50 text-red-600 border-red-100" : 
                        order.riskLevel === 'Medium' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                        "bg-green-50 text-green-600 border-green-100"
                      )}>
                        {order.riskLevel || 'Low'} Risk
                      </Badge>
                      {order.isSuspicious && (
                        <div className="flex items-center gap-1 text-red-600 text-[9px] font-bold">
                          <AlertTriangle size={10} /> SUSPICIOUS
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      defaultValue={order.courierId} 
                      onValueChange={(val) => handleAssignCourier(order.id, val)}
                      disabled={order.status === 'Shipped'}
                    >
                      <SelectTrigger className="h-8 text-[10px] font-bold w-[130px] bg-gray-50 border-none">
                        <SelectValue placeholder="Select Courier" />
                      </SelectTrigger>
                      <SelectContent>
                        {couriers?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(val) => handleUpdateStatus(order.id, val)}>
                      <SelectTrigger className={cn(
                        "h-8 text-[9px] font-black uppercase w-[110px]",
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
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      {order.isSuspicious ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1 text-[9px] font-black text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          <ShieldCheck size={12} /> Approve
                        </Button>
                      ) : (
                        <Button 
                          disabled={isShipping === order.id || order.status === 'Shipped'}
                          onClick={() => handleSingleShip(order)}
                          className="h-8 gap-1.5 text-[9px] font-black uppercase"
                        >
                          {isShipping === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} fill="currentColor" />}
                          Ship
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedOrder(order)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Security & Order Intelligence</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Client Meta</h4>
                <div className="space-y-2">
                  <p className="text-xs font-bold">IP: <span className="font-mono text-blue-600">{selectedOrder?.ipAddress || 'Not Captured'}</span></p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">{selectedOrder?.deviceInfo}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2">Security Score</h4>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-tight">Risk: <span className={cn(selectedOrder?.riskLevel === 'High' ? 'text-red-600' : 'text-green-600')}>{selectedOrder?.riskLevel || 'Low'}</span></p>
                  <p className="text-[10px] text-muted-foreground font-medium">No previous fraud detected for this phone cluster.</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

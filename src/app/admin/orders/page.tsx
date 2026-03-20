
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
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  XCircle
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
  
  // Selection & Bulk State
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
      toast({ title: "Order Updated", description: `Status changed to ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
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
          courierTracking: result.courierResponse?.tracking_number || result.courierResponse?.id || result.courierResponse?.consignment_id || 'N/A'
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

  const handleBulkShip = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkProcessing(true);
    
    const newStatuses = { ...bulkStatus };
    
    for (const id of selectedOrderIds) {
      const order = orders?.find(o => o.id === id);
      if (!order || order.status === 'Shipped' || order.status === 'Delivered') continue;
      
      newStatuses[id] = 'pending';
      setBulkStatus({ ...newStatuses });

      const result = await shipWithCourier(order);
      
      if (result.success) {
        newStatuses[id] = 'success';
      } else {
        newStatuses[id] = 'failed';
      }
      setBulkStatus({ ...newStatuses });
    }
    
    setIsBulkProcessing(false);
    toast({ title: "Bulk Processing Complete", description: "Checked all selected orders." });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders?.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders?.map(o => o.id) || []);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-muted-foreground text-sm">Full lifecycle product sales control</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11 shadow-sm"><ShoppingCart size={18} /> POS Order</Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary text-white font-black">{selectedOrderIds.length} SELECTED</Badge>
            <p className="text-xs font-bold text-gray-600">Ready for bulk logistics processing.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedOrderIds([])} 
              className="h-9 font-bold rounded-xl"
            >
              Clear
            </Button>
            <Button 
              disabled={isBulkProcessing} 
              onClick={handleBulkShip} 
              className="h-9 gap-2 font-black uppercase text-xs rounded-xl shadow-lg shadow-primary/20"
            >
              {isBulkProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap size={14} fill="currentColor" />}
              Bulk Create Shipments
            </Button>
          </div>
        </div>
      )}

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

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[50px] pl-8">
                  <Checkbox 
                    checked={selectedOrderIds.length === filteredOrders?.length && filteredOrders?.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold py-5 text-[10px] uppercase tracking-widest text-gray-500">Order ID</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-500">Customer</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-500">Amount</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-500">Logistics Partner</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-500 text-center">Action</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-gray-500">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filteredOrders?.length ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className={cn(
                    "hover:bg-gray-50/50 transition-colors group",
                    selectedOrderIds.includes(order.id) && "bg-primary/5"
                  )}>
                    <TableCell className="pl-8">
                      <Checkbox 
                        checked={selectedOrderIds.includes(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                        disabled={order.status === 'Shipped' || order.status === 'Delivered'}
                      />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="font-black text-gray-900 text-xs">#ORD-{order.id.slice(0, 6).toUpperCase()}</div>
                      <div className="text-[9px] text-muted-foreground mt-1 uppercase font-bold">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700">{order.customerName}</div>
                      <div className="text-[10px] text-muted-foreground">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-primary">৳{(order.totalPrice || order.totalAmount || 0).toLocaleString()}</div>
                      <Badge variant="outline" className="text-[8px] font-black border-none bg-gray-50 mt-1 uppercase">
                        {order.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.courierId} 
                        onValueChange={(val) => handleAssignCourier(order.id, val)}
                        disabled={order.status === 'Shipped' || order.status === 'Delivered'}
                      >
                        <SelectTrigger className="h-8 text-[10px] font-bold w-[140px] bg-gray-50 border-none">
                          <SelectValue placeholder="Select Courier" />
                        </SelectTrigger>
                        <SelectContent>
                          {couriers?.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center gap-1">
                         <Button 
                           variant={order.status === 'Shipped' ? "secondary" : "default"}
                           size="sm" 
                           disabled={isShipping === order.id || order.status === 'Shipped' || order.status === 'Delivered'}
                           onClick={() => handleSingleShip(order)}
                           className="h-8 gap-1.5 text-[9px] font-black uppercase tracking-tighter"
                         >
                           {isShipping === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} fill="currentColor" />}
                           {order.status === 'Shipped' ? 'Shipped' : 'Create Shipment'}
                         </Button>
                         
                         {/* Bulk/Result Feedback */}
                         {bulkStatus[order.id] && (
                           <div className="animate-in fade-in zoom-in-95">
                             {bulkStatus[order.id] === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                             {bulkStatus[order.id] === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                             {bulkStatus[order.id] === 'failed' && <XCircle className="h-3 w-3 text-destructive" />}
                           </div>
                         )}
                       </div>
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
                <TableRow><TableCell colSpan={8} className="text-center py-20 italic text-muted-foreground">No matching orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
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
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Logistics Sync</h4>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700">Courier: <span className="text-primary">{selectedOrder?.courierName || 'Unassigned'}</span></p>
                  {selectedOrder?.courierTracking && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-mono text-[10px] text-blue-700">
                      Tracking: {selectedOrder.courierTracking}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Customer</h4>
                <div className="space-y-1">
                  <p className="text-sm font-bold">{selectedOrder?.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder?.customerPhone}</p>
                  <p className="text-xs text-muted-foreground italic">"{selectedOrder?.address}"</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Items</h4>
              <div className="space-y-2">
                {selectedOrder?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white rounded-lg border flex items-center justify-center text-[10px] font-black">x{item.quantity}</div>
                       <p className="text-xs font-bold">{item.name}</p>
                    </div>
                    <p className="text-xs font-black">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, addDoc, where } from 'firebase/firestore';
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
import { 
  Calendar, 
  Clock, 
  Trash2, 
  FileText, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  X,
  User,
  MapPin,
  Wrench,
  Zap,
  Wallet,
  Smartphone,
  ChevronDown,
  Users,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOrCreateInvoice } from '@/lib/invoice-utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { BookingAssignDialog } from '@/components/admin/BookingAssignDialog';

function BookingsListContent() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', date: '', time: '8AM - 12PM' });
  const [pricing, setPricing] = useState({ discount: 0, serviceFee: 100 });
  
  // Tracking State
  const [assignBooking, setAssignBooking] = useState<any>(null);

  // Payment State
  const [paymentCategory, setPaymentCategory] = useState<'cod' | 'online'>('cod');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'));
  }, [db, user]);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const gatewaysQuery = useMemoFirebase(() => db ? query(collection(db, 'payment_methods'), where('isEnabled', '==', true)) : null, [db]);

  const { data: bookings, isLoading } = useCollection(bookingsQuery);
  const { data: allServices } = useCollection(servicesQuery);
  const { data: activeGateways } = useCollection(gatewaysQuery);

  const stats = useMemo(() => {
    if (!bookings) return { total: 0, pending: 0, completed: 0, cancelled: 0 };
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'New' || b.status === 'Assigned').length,
      completed: bookings.filter(b => b.status === 'Completed').length,
      cancelled: bookings.filter(b => b.status === 'Cancelled').length
    };
  }, [bookings]);

  const filteredBookings = bookings?.filter(b => 
    b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allServices?.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, allServices]);

  const addItem = (s: any) => {
    const existing = selectedItems.find(i => i.id === s.id);
    if (!existing) {
      setSelectedItems([...selectedItems, { id: s.id, name: s.title, price: s.basePrice, quantity: 1 }]);
    }
    setSearchQuery('');
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const total = subtotal + pricing.serviceFee - pricing.discount;
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const handleCreateBooking = async () => {
    if (!db) return;
    if (selectedItems.length === 0 || !customer.name || !customer.phone || !customer.address || !customer.date) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "All fields are required." });
      return;
    }

    if (paymentCategory === 'online' && !selectedGatewayId) {
      toast({ variant: "destructive", title: "Payment Error", description: "Please select a gateway." });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedGateway = activeGateways?.find(g => g.id === selectedGatewayId);
      const bookingData = {
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        dateTime: customer.date,
        timeSlot: customer.time,
        serviceTitle: selectedItems[0]?.name,
        items: selectedItems.map(i => ({ ...i, itemType: 'service' })),
        subtotal,
        discount: pricing.discount,
        serviceFee: pricing.serviceFee,
        totalPrice: total,
        paymentMethod: paymentCategory === 'cod' ? 'Cash on Hand' : (selectedGateway?.name || 'Online'),
        status: 'New',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      await getOrCreateInvoice(db, docRef.id, 'booking', bookingData);

      toast({ title: "Success", description: "Booking added to schedule." });
      setIsCreateOpen(false);
      setSelectedItems([]);
      setCustomer({ name: '', phone: '', address: '', date: '', time: '8AM - 12PM' });
      setPaymentCategory('cod');
      setSelectedGatewayId('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'bookings', id), { status });
    toast({ title: "Booking Updated" });
  };

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

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#081621]">Service Bookings</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage professional service schedules and technicians</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-black gap-2 h-11 px-6 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> New Intake
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Bookings", val: stats.total, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Unassigned", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Jobs Done", val: stats.completed, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Cancelled", val: stats.cancelled, icon: XCircle, bg: "bg-red-50", color: "text-red-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by customer or service..." 
              className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Service</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Customer</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Schedule</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                ) : filteredBookings?.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="font-black text-gray-900 text-xs uppercase">{booking.serviceTitle || 'General'}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {booking.assignedEmployees?.length > 0 ? (
                          <div className="flex -space-x-2">
                            {booking.assignedEmployees.map((e: any) => (
                              <div key={e.uid} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[8px] font-black text-white border border-white" title={e.name}>
                                {e.name[0]}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-red-500 uppercase">Unassigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700 uppercase">{booking.customerName}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{booking.address}</div>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-gray-500">
                      {booking.dateTime ? format(new Date(booking.dateTime), 'MMM dd, HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={booking.status} onValueChange={(v) => handleUpdateStatus(booking.id, v)}>
                        <SelectTrigger className="h-8 text-[9px] font-black uppercase w-[110px] border-none bg-indigo-50 text-indigo-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['New', 'Assigned', 'On The Way', 'Service Started', 'Completed', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => setAssignBooking(booking)} title="Assign Team"><Users size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenInvoice(booking)} disabled={isProcessingInvoice === booking.id}><FileText size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'bookings', booking.id))}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BookingAssignDialog 
        booking={assignBooking} 
        isOpen={!!assignBooking} 
        onClose={() => setAssignBooking(null)} 
      />

      {/* 🛠️ IMPROVED SCROLLABLE DIALOG UI */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] p-0 overflow-hidden border-none rounded-none md:rounded-[2.5rem] shadow-2xl bg-white flex flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            <header className="p-6 md:p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <ClipboardList className="text-primary" size={24} /> New Booking Intake
                </DialogTitle>
                <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Manual service enrollment protocol</DialogDescription>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Selection</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input 
                        placeholder="Search service catalog..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 md:h-12 pl-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner"
                      />
                      {filteredServices.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
                          {filteredServices.map(s => (
                            <div key={s.id} onClick={() => addItem(s)} className="p-4 flex items-center justify-between hover:bg-primary/5 cursor-pointer border-b last:border-none">
                              <div>
                                <p className="font-bold text-sm uppercase">{s.title}</p>
                                <p className="text-[10px] text-muted-foreground">৳{s.basePrice}</p>
                              </div>
                              <Plus size={16} className="text-primary" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-black text-xs uppercase truncate">{item.name}</p>
                            <p className="text-[9px] font-bold text-primary mt-0.5">৳{item.price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => {
                              const next = [...selectedItems];
                              next[idx].quantity = Math.max(1, next[idx].quantity - 1);
                              setSelectedItems(next);
                            }} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black">-</button>
                            <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                            <button onClick={() => {
                              const next = [...selectedItems];
                              next[idx].quantity++;
                              setSelectedItems(next);
                            }} className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-black">+</button>
                            <button onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))} className="ml-2 text-red-400 hover:text-red-600"><X size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Client Identification</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Recipient Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                      <Input placeholder="Mobile No" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                    <Input type="datetime-local" value={customer.date} onChange={e => setCustomer({...customer, date: e.target.value})} className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    <Textarea placeholder="Full Service Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="bg-gray-50 border-none rounded-2xl min-h-[80px] p-4 shadow-inner" />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 flex flex-col gap-8 h-fit">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Wallet size={16} /> Financial Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Service/Admin Fee</Label>
                        <Input type="number" value={pricing.serviceFee} onChange={e => setPricing({...pricing, serviceFee: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black rounded-lg shadow-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Campaign Discount</Label>
                        <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black text-red-600 rounded-lg shadow-sm" />
                      </div>
                      <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-400">Grand Total</span>
                          <span className="text-4xl font-black text-primary tracking-tighter">৳{total.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">BDT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Settlement Logic</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPaymentCategory('cod')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'cod' ? "border-primary bg-primary/5 shadow-md" : "bg-white border-gray-100 opacity-60 hover:opacity-100")}
                      >
                        <Wallet size={20} className={paymentCategory === 'cod' ? "text-primary" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Post-Service</span>
                      </div>
                      <div 
                        onClick={() => setPaymentCategory('online')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'online' ? "border-blue-600 bg-blue-50 shadow-md" : "bg-white border-gray-100 opacity-60 hover:opacity-100")}
                      >
                        <Smartphone size={20} className={paymentCategory === 'online' ? "text-blue-600" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Gateway</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
              <Button onClick={handleCreateBooking} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Booking Plan"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookingsManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <BookingsListContent />
    </Suspense>
  );
}

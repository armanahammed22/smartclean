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
  ShieldCheck
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
      toast({ variant: "destructive", title: "তথ্য অসম্পূর্ণ", description: "সবগুলো ঘর সঠিকভাবে পূরণ করুন।" });
      return;
    }

    if (paymentCategory === 'online' && !selectedGatewayId) {
      toast({ variant: "destructive", title: "Payment Method Error", description: "Please select an online gateway." });
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

      toast({ title: "সফল হয়েছে", description: "নতুন বুকিং তৈরি হয়েছে!" });
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
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#081621]">বুকিং ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground text-sm font-medium">সার্ভিস শিডিউল এবং টেকনিশিয়ান ট্র্যাকিং</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-black gap-2 h-11 px-6 shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">
          <Plus size={18} /> নতুন বুকিং
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "মোট বুকিং", val: stats.total, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "পেন্ডিং", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "সম্পন্ন", val: stats.completed, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "বাতিল", val: stats.cancelled, icon: XCircle, bg: "bg-red-50", color: "text-red-600" }
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
              placeholder="কাস্টমার বা সার্ভিস দিয়ে খুঁজুন..." 
              className="pl-10 h-11 bg-white border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
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
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => setAssignBooking(booking)} title="Assign Team"><Users size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenInvoice(booking)} disabled={isProcessingInvoice === booking.id}><FileText size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'bookings', booking.id))}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BookingAssignDialog 
        booking={assignBooking} 
        isOpen={!!assignBooking} 
        onClose={() => setAssignBooking(null)} 
      />

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
          <div className="flex flex-col h-[85vh]">
            <header className="p-6 bg-[#081621] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl"><Calendar size={24} /></div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">নতুন বুকিং</DialogTitle>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">সার্ভিস নির্বাচন</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input 
                        placeholder="সার্ভিস খুঁজুন..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold"
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
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
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
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">গ্রাহকের তথ্য</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="নাম" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                      <Input placeholder="ফোন" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <Input type="datetime-local" value={customer.date} onChange={e => setCustomer({...customer, date: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                    <Textarea placeholder="ঠিকানা" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="bg-gray-50 border-none rounded-xl min-h-[80px]" />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-6 md:p-8 rounded-[2rem] border border-gray-100 flex flex-col gap-8 h-fit">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><Wallet size={16} /> সারসংক্ষেপ</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span></div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">সার্ভিস ফি</Label>
                        <Input type="number" value={pricing.serviceFee} onChange={e => setPricing({...pricing, serviceFee: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-[10px] font-black uppercase text-gray-400">ডিসকাউন্ট</Label>
                        <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 bg-white text-right font-black text-red-600" />
                      </div>
                      <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-400">মোট প্রদেয়</span>
                          <span className="text-4xl font-black text-primary tracking-tighter">৳{total.toLocaleString()}</span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">BDT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">পেমেন্ট মেথড</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setPaymentCategory('cod')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'cod' ? "border-primary bg-primary/5" : "bg-white border-gray-100 opacity-60")}
                      >
                        <Wallet size={20} className={paymentCategory === 'cod' ? "text-primary" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase">Cash on Hand</span>
                      </div>
                      <div 
                        onClick={() => setPaymentCategory('online')} 
                        className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentCategory === 'online' ? "border-blue-600 bg-blue-50" : "bg-white border-gray-100 opacity-60")}
                      >
                        <Smartphone size={20} className={paymentCategory === 'online' ? "text-blue-600" : "text-gray-400"} />
                        <span className="text-[10px] font-black uppercase">Online Gateway</span>
                      </div>
                    </div>

                    {paymentCategory === 'online' && (
                      <div className="space-y-3 pt-2 animate-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase text-blue-600 ml-1">সিলেক্ট গেটওয়ে</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {activeGateways?.filter(g => g.type !== 'cod' && g.type !== 'cash').map(gateway => (
                            <div 
                              key={gateway.id}
                              onClick={() => setSelectedGatewayId(gateway.id)}
                              className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer",
                                selectedGatewayId === gateway.id ? "border-blue-600 bg-white" : "border-gray-100 bg-gray-50/50"
                              )}
                            >
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                                {gateway.logoUrl ? <Image src={gateway.logoUrl} alt={gateway.name} fill className="object-contain p-1" unoptimized /> : <Wallet size={16} className="m-auto text-gray-300" />}
                              </div>
                              <span className="text-xs font-bold uppercase flex-1">{gateway.name}</span>
                              {selectedGatewayId === gateway.id && <CheckCircle2 size={16} className="text-blue-600" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleCreateBooking} disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 uppercase tracking-tight gap-2 transition-transform active:scale-95">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "বুকিং নিশ্চিত করুন"}
                  </Button>
                </div>
              </div>
            </div>
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

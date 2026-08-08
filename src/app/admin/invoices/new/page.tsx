
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, addDoc, query, where, doc, setDoc, getDocs, limit, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  User as UserIcon, 
  ShoppingCart,
  X,
  Calculator,
  Search,
  Banknote,
  ReceiptText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getNextInvoiceNumber } from '@/lib/invoice-utils';

export default function CreateInvoicePage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Feature Modes
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isManualItem, setIsManualItem] = useState(false);
  const [isCombinedPricing, setIsCombinedPricing] = useState(false);

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  const [packagePrice, setPackagePrice] = useState('');
  
  // Selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1, unit: 'Qty' });

  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', delivery: 0, vatPercent: 0 });
  const [payment, setPayment] = useState({ paidAmount: '0', method: 'Cash', notes: '' });
  const [config, setConfig] = useState({ 
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    terms: [] as string[],
    tagline: '',
    notes: '' 
  });

  // Data Fetch
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);

  const { data: customersRaw } = useCollection(customersQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: globalSettings } = useDoc(settingsRef);

  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [customersRaw]);

  useEffect(() => {
    if (db) {
      getNextInvoiceNumber(db).then(setInvoiceNumber);
    }
  }, [db]);

  useEffect(() => {
    if (globalSettings) {
      setConfig(prev => ({
        ...prev,
        terms: Array.isArray(globalSettings.invoiceDefaultTerms) ? globalSettings.invoiceDefaultTerms : [globalSettings.invoiceDefaultTerms || ''],
        tagline: globalSettings.invoiceTagline || ''
      }));
    }
  }, [globalSettings]);

  const handleAddItemToBill = () => {
    if (isManualItem) {
      if (!manualItem.name || !manualItem.price) return;
      setItems([...items, {
        id: 'manual-' + Date.now(),
        name: manualItem.name,
        price: parseFloat(manualItem.price) || 0,
        quantity: manualItem.quantity,
        unit: manualItem.unit,
        discount: 0,
        total: (parseFloat(manualItem.price) || 0) * manualItem.quantity
      }]);
      setManualItem({ name: '', price: '', quantity: 1, unit: 'Qty' });
    } else {
      const service = services?.find(s => s.id === selectedProductId);
      if (!service) return;
      const newItem = {
        id: service.id + '-' + Date.now(),
        name: service.title,
        price: service.basePrice,
        quantity: selectedQty,
        unit: service.pricingType === 'sqft' ? 'Sqft' : 'Pcs',
        discount: 0,
        total: service.basePrice * selectedQty
      };
      setItems([...items, newItem]);
      setSelectedProductId('');
      setSelectedQty(1);
    }
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItemField = (id: string, field: string, val: any) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const updated = { ...i, [field]: val };
        updated.total = (parseFloat(updated.price) || 0) * (parseFloat(updated.quantity) || 0) - (parseFloat(updated.discount) || 0);
        return updated;
      }
      return i;
    }));
  };

  const totals = useMemo(() => {
    const calculatedSubtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    const subtotal = isCombinedPricing ? (parseFloat(packagePrice) || 0) : calculatedSubtotal;
    
    const itemDiscounts = items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
    
    let globalDiscountAmt = pricing.discountType === 'percentage' 
      ? (subtotal * (pricing.discount / 100)) 
      : pricing.discount;
      
    const currentTotal = subtotal - itemDiscounts - globalDiscountAmt + pricing.delivery;
    const initialPaid = parseFloat(payment.paidAmount) || 0;
    const dueAmount = Math.max(0, currentTotal - initialPaid);

    return { calculatedSubtotal, subtotal, itemDiscounts, globalDiscountAmt, total: Math.max(0, currentTotal), initialPaid, dueAmount };
  }, [items, pricing, payment, isCombinedPricing, packagePrice]);

  const addTerm = () => setConfig({ ...config, terms: [...config.terms, ''] });
  const updateTerm = (idx: number, val: string) => {
    const next = [...config.terms];
    next[idx] = val;
    setConfig({ ...config, terms: next });
  };
  const removeTerm = (idx: number) => setConfig({ ...config, terms: config.terms.filter((_, i) => i !== idx) });

  const handleSave = async () => {
    if (!db) return;
    if (!customer.name || items.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Customer and items are required." });
      return;
    }

    setIsSubmitting(true);
    const batch = writeBatch(db);

    try {
      let currentCustomerId = customer.id;

      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          const newRef = doc(collection(db, 'users'));
          batch.set(newRef, {
            uid: newRef.id,
            name: customer.name,
            phone: phone,
            address: customer.address,
            role: 'customer',
            status: 'active',
            totalInvoiced: 0, totalPaid: 0, outstandingBalance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          currentCustomerId = newRef.id;
        } else {
          currentCustomerId = snap.docs[0].id;
        }
      }

      const invoiceRef = doc(collection(db, 'invoices'));
      
      const invoiceData: any = {
        invoiceNumber,
        customerId: currentCustomerId,
        customerInfo: { ...customer, id: currentCustomerId },
        items,
        subtotal: totals.subtotal,
        isCombinedPricing,
        combinedPrice: isCombinedPricing ? totals.subtotal : null,
        discount: pricing.discount,
        discountType: pricing.discountType,
        deliveryCharge: pricing.delivery,
        total: totals.total,
        paymentStatus: totals.dueAmount <= 0 ? 'Paid' : totals.initialPaid > 0 ? 'Partial' : 'Unpaid',
        paidAmount: totals.initialPaid,
        dueAmount: totals.dueAmount,
        paymentHistory: totals.initialPaid > 0 ? [{
          id: 'pay_init_' + Date.now(),
          amount: totals.initialPaid,
          date: new Date().toISOString(),
          method: payment.method,
          notes: payment.notes || 'Initial Payment'
        }] : [],
        terms: config.terms,
        tagline: config.tagline,
        createdAt: new Date(config.issueDate).toISOString(),
        dueDate: config.expiryDate ? new Date(config.expiryDate).toISOString() : null,
        updatedAt: serverTimestamp()
      };

      batch.set(invoiceRef, invoiceData);

      // Update Customer Overall Balance
      if (currentCustomerId) {
        const customerRef = doc(db, 'users', currentCustomerId);
        batch.update(customerRef, {
          totalInvoiced: increment(totals.total),
          totalPaid: increment(totals.initialPaid),
          outstandingBalance: increment(totals.dueAmount),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      
      toast({ title: "Invoice Published", description: `Saved with ৳${totals.initialPaid} initial payment.` });
      router.push('/admin/invoices');
    } catch (e) {
      toast({ variant: "destructive", title: "Process Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 min-w-0 -mt-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">{invoiceNumber || 'New Invoice'}</h1>
        </div>
        <Button onClick={handleSave} disabled={isSubmitting} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Create Invoice</>}
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <UserIcon size={12} /> Client Identity
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">New Profile</Label>
               <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
                {isNewCustomer ? (
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Full Name" className="h-9" />
                ) : (
                  <Select value={customer.id} onValueChange={(val) => {
                    const c = clients?.find(i => i.id === val);
                    if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '', address: c.address || '' });
                  }}>
                    <SelectTrigger className="h-9 bg-white border-gray-200">
                      <SelectValue placeholder="Search existing..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Mobile Number</Label>
                <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} placeholder="01XXXXXXXXX" className="h-9" disabled={!isNewCustomer && customer.id !== ''} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Issue Date</Label>
                <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Due Date</Label>
                <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9" />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Delivery Address</Label>
                <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} placeholder="House, Road, Area, District" className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <ShoppingCart size={12} /> Product & Service Entry
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-indigo-600">Combined Pricing</Label>
               <Switch checked={isCombinedPricing} onCheckedChange={setIsCombinedPricing} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
              {!isManualItem ? (
                <>
                  <div className="md:col-span-7 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Select Item</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 bg-white border-gray-200">
                        <SelectValue placeholder="Choose product/service..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area Qty</Label>
                    <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Item Name</Label>
                    <Input value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} placeholder="Item Name" className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Rate</Label>
                    <Input type="number" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})} placeholder="0.00" className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area</Label>
                    <Input type="number" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: parseInt(e.target.value) || 1})} className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit</Label>
                    <Select value={manualItem.unit} onValueChange={v => setManualItem({...manualItem, unit: v})}>
                      <SelectTrigger className="h-9 bg-white rounded-lg px-2 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-bold uppercase">{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItemToBill} className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase gap-2 shadow-md">
                  <Plus size={14} /> Add Item
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-none">
                    <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit/Area</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-24">Rate</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Discount (৳)</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Net Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/30">
                      <TableCell className="py-3">
                        <p className="font-bold text-[11px] text-gray-900 uppercase">{item.name}</p>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                          <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={item.discount || 0} onChange={e => updateItemField(item.id, 'discount', parseFloat(e.target.value) || 0)} className="h-7 w-24 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell className="text-right font-black text-[11px] text-gray-900">৳{item.total?.toFixed(2)}</TableCell>
                      <TableCell><button type="button" onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button></TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-300 italic text-[10px] uppercase tracking-widest">No items added to bill.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
             <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
                <CardHeader className="bg-emerald-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
                   <CardTitle className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-700">
                      <Wallet size={12} /> Settlement & Initial Payment
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Amount Paid (৳)</Label>
                        <div className="relative">
                           <Banknote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                           <Input 
                              type="number" 
                              value={payment.paidAmount} 
                              onChange={e => setPayment({...payment, paidAmount: e.target.value})} 
                              className="h-10 pl-9 font-black text-emerald-700 bg-emerald-50/20 border-emerald-100" 
                              placeholder="0.00" 
                           />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Payment Channel</Label>
                        <Select value={payment.method} onValueChange={v => setPayment({...payment, method: v})}>
                           <SelectTrigger className="h-10 bg-white border-gray-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>
                              {['Cash', 'bKash', 'Nagad', 'Bank Transfer'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                           </SelectContent>
                        </Select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Terms & Conditions</Label>
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 shadow-inner">
                        {config.terms.map((term: string, i: number) => (
                          <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                            <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-8 border-none bg-white text-[10px] font-medium" />
                            <button type="button" onClick={() => removeTerm(i)} className="p-1.5 text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0"><X size={12}/></button>
                          </div>
                        ))}
                        <button type="button" onClick={addTerm} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-lg h-9 text-[9px] font-black uppercase text-gray-400 hover:text-primary hover:border-primary transition-all">
                          <Plus size={12}/> Add Custom Rule
                        </button>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-xl rounded-2xl bg-slate-50 border border-gray-100 overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-5">
                {!isCombinedPricing ? (
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Gross Subtotal</span>
                    <span>৳{totals.calculatedSubtotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      <span>Individual Total</span>
                      <span className="text-gray-400 line-through">৳{totals.calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-indigo-700 ml-1">Combo Package Price (৳)</Label>
                      <Input type="number" value={packagePrice} onChange={e => setPackagePrice(e.target.value)} placeholder="0.00" className="h-12 bg-white border-none rounded-xl font-black text-lg text-indigo-700 shadow-inner" />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center gap-4">
                   <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Global Adjustment</span>
                   <div className="flex gap-1">
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 w-20 bg-white border-gray-200 text-center font-black text-rose-600 shadow-sm" />
                      <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                         <SelectTrigger className="h-9 w-14 bg-white border-gray-200 text-xs font-black"><SelectValue/></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">৳</SelectItem></SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Grand Final Value</span>
                      <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Paid Today</span>
                       <span className="text-lg font-black text-emerald-700">৳{totals.initialPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Net Arrears Due</span>
                       <span className="text-lg font-black text-rose-600">৳{totals.dueAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

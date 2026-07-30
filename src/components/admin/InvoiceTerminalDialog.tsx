'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDocs, updateDoc, where, setDoc, addDoc, limit, serverTimestamp, increment } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  X, 
  User as UserIcon, 
  ShoppingCart, 
  Calculator, 
  Save, 
  Info,
  Package,
  ReceiptText,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceTerminalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: any;
}

export function InvoiceTerminalDialog({ isOpen, onClose, editingInvoice }: InvoiceTerminalDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature Modes
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isManualItem, setIsManualItem] = useState(false);

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1, unit: 'Qty' });

  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', delivery: 0, vatPercent: 0 });
  const [config, setConfig] = useState({ 
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '' 
  });

  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'customer'), limit(100)) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);

  const { data: customersRaw } = useCollection(customersQuery);
  const { data: services } = useCollection(servicesQuery);

  const clients = useMemo(() => customersRaw?.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [customersRaw]);

  useEffect(() => {
    if (editingInvoice) {
      setCustomer({
        id: editingInvoice.customerId || '',
        name: editingInvoice.customerInfo?.name || '',
        phone: editingInvoice.customerInfo?.phone || '',
        address: editingInvoice.customerInfo?.address || ''
      });
      setItems(editingInvoice.items?.map((i: any) => ({
        id: i.id || Math.random().toString(),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        unit: i.unit || 'Qty',
        discount: 0,
        total: i.price * i.quantity
      })) || []);
      setPricing({
        discount: editingInvoice.discount || 0,
        discountType: editingInvoice.discountType || 'percentage',
        delivery: editingInvoice.deliveryCharge || 0,
        vatPercent: editingInvoice.vatPercent || 0
      });
      setConfig({
        invoiceNumber: editingInvoice.invoiceNumber || '',
        issueDate: editingInvoice.createdAt ? editingInvoice.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: editingInvoice.dueDate ? editingInvoice.dueDate.split('T')[0] : '',
        notes: editingInvoice.notes || ''
      });
    }
  }, [editingInvoice]);

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
    const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    const itemDiscounts = items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
    
    let globalDiscountAmt = pricing.discountType === 'percentage' 
      ? (subtotal * (pricing.discount / 100)) 
      : pricing.discount;
      
    const finalTotal = subtotal - itemDiscounts - globalDiscountAmt + pricing.delivery;

    return { subtotal, globalDiscountAmt, total: Math.max(0, finalTotal) };
  }, [items, pricing]);

  const handleSave = async () => {
    if (!db) return;
    if (!customer.name || items.length === 0) {
      toast({ variant: "destructive", title: "Validation Error" });
      return;
    }

    setIsSubmitting(true);
    try {
      let currentCustomerId = customer.id;

      if (isNewCustomer || !currentCustomerId) {
        const phone = customer.phone.replace(/\D/g, '');
        const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          const newRef = doc(collection(db, 'users'));
          await setDoc(newRef, {
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

      const invoiceData = {
        customerId: currentCustomerId,
        customerInfo: { ...customer, id: currentCustomerId },
        items,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        total: totals.total,
        createdAt: new Date(config.issueDate).toISOString(),
        dueDate: config.expiryDate ? new Date(config.expiryDate).toISOString() : null,
        updatedAt: serverTimestamp()
      };

      if (editingInvoice) {
        await updateDoc(doc(db, 'invoices', editingInvoice.id), invoiceData);
      } else {
        await addDoc(collection(db, 'invoices'), { ...invoiceData, invoiceNumber: 'INV-' + Date.now().toString().slice(-6) });
      }
      toast({ title: "Invoice Published" });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Process Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-full md:h-auto md:max-h-[95vh] p-0 border-none rounded-[1.5rem] shadow-2xl bg-white flex flex-col overflow-hidden">
        <header className="h-[60px] bg-[#081621] text-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-xl text-primary"><ReceiptText size={20} /></div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight leading-none">Invoice Terminal</DialogTitle>
              <DialogDescription className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">
                {editingInvoice ? 'UPDATING RECORD' : `CREATING NEW RECORD`}
              </DialogDescription>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-4">
           <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Client Profile</CardTitle>
                <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
                   <Label className="text-[8px] font-black uppercase text-primary">New Customer</Label>
                   <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} className="scale-75" />
                </div>
             </CardHeader>
             <CardContent className="p-4">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="space-y-1">
                   <Label className="text-[9px] font-bold text-gray-500 uppercase">Customer Name</Label>
                   {isNewCustomer ? (
                     <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9" placeholder="Type name..." />
                   ) : (
                     <Select onValueChange={(val) => {
                       const c = clients?.find(i => i.id === val);
                       if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '', address: c.address || '' });
                     }}>
                       <SelectTrigger className="h-9 bg-gray-50 border-none rounded-lg font-bold shadow-inner">
                         <SelectValue placeholder={customer.name || "Search customers..."} />
                       </SelectTrigger>
                       <SelectContent>
                         {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   )}
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[9px] font-bold text-gray-500 uppercase">Mobile Number</Label>
                   <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" placeholder="01XXXXXXXXX" disabled={!isNewCustomer && customer.id !== ''} />
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[9px] font-bold text-gray-500 uppercase">Invoice Date</Label>
                   <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9 bg-gray-50 border-none" />
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[9px] font-bold text-gray-500 uppercase">Due Date</Label>
                   <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9 bg-gray-50 border-none" />
                 </div>
                 <div className="md:col-span-4 space-y-1">
                   <Label className="text-[9px] font-bold text-gray-500 uppercase">Site Address</Label>
                   <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9" placeholder="Detailed Address" />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2"><ShoppingCart size={12}/> Items Matrix</CardTitle>
                <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
                   <Label className="text-[8px] font-black uppercase text-primary">Manual Entry</Label>
                   <Switch checked={isManualItem} onCheckedChange={setIsManualItem} className="scale-75" />
                </div>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                 {!isManualItem ? (
                   <>
                     <div className="md:col-span-7 space-y-1">
                       <Label className="text-[9px] font-bold uppercase text-gray-400">Select Products</Label>
                       <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                         <SelectTrigger className="h-9 bg-white border-gray-200">
                           <SelectValue placeholder="Choose product..." />
                         </SelectTrigger>
                         <SelectContent>
                           {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
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
                     <div className="md:col-span-4 space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-gray-400">Item Name</Label>
                        <Input value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} className="h-9 bg-white" />
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-gray-400">Rate</Label>
                        <Input type="number" value={manualItem.price} onChange={e => setManualItem({...manualItem, price: e.target.value})} className="h-9 bg-white" />
                     </div>
                     <div className="md:col-span-2 space-y-1">
                        <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area</Label>
                        <Input type="number" value={manualItem.quantity} onChange={e => setManualItem({...manualItem, quantity: parseInt(e.target.value) || 1})} className="h-9 bg-white" />
                     </div>
                     <div className="md:col-span-2 space-y-1">
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
                 <Button type="button" onClick={handleAddItemToBill} className="md:col-span-2 h-9 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-tight shadow-md">+ Add to Bill</Button>
               </div>

               <div className="rounded-xl border border-gray-100 overflow-hidden">
                 <Table>
                   <TableHeader className="bg-gray-50">
                     <TableRow>
                       <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                       <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit/Area</TableHead>
                       <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit</TableHead>
                       <TableHead className="text-[9px] font-black uppercase text-right w-24">Unit Price</TableHead>
                       <TableHead className="text-[9px] font-black uppercase text-right w-24">Discount</TableHead>
                       <TableHead className="text-[9px] font-black uppercase text-right w-28">Net Amount</TableHead>
                       <TableHead></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {items.map((item) => (
                       <TableRow key={item.id}>
                         <TableCell className="font-bold text-[11px] uppercase py-2">{item.name}</TableCell>
                         <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', e.target.value)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white" /></TableCell>
                         <TableCell>
                            <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                              <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                              </SelectContent>
                            </Select>
                         </TableCell>
                         <TableCell><Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', e.target.value)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white" /></TableCell>
                         <TableCell><Input type="number" value={item.discount} onChange={e => updateItemField(item.id, 'discount', e.target.value)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white" /></TableCell>
                         <TableCell className="text-right font-black text-[11px] text-gray-900">৳{item.total.toFixed(2)}</TableCell>
                         <TableCell><button onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600"><Trash2 size={14}/></button></TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
             <div className="lg:col-span-7 space-y-2">
               <Label className="text-[10px] font-black uppercase text-gray-400">Ledger Remarks</Label>
               <Textarea value={config.notes} onChange={e => setConfig({...config, notes: e.target.value})} className="h-28 bg-white rounded-xl shadow-inner border-gray-100" />
             </div>
             <div className="lg:col-span-5 bg-slate-50 border border-gray-100 p-6 rounded-[1.5rem] space-y-4">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Gross Valuation</span>
                  <span>{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                   <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Global Discount</span>
                   <div className="flex gap-1">
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-8 w-20 text-center bg-white border-gray-200 text-rose-600 font-black shadow-sm" />
                      <Select value={pricing.discountType} onValueChange={(v:any) => setPricing({...pricing, discountType: v})}>
                         <SelectTrigger className="h-8 w-14 bg-white border-gray-200 text-xs font-black"><SelectValue/></SelectTrigger>
                         <SelectContent><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">৳</SelectItem></SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="pt-5 border-t border-gray-200 flex justify-between items-end">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Net Final Bill</span>
                      <span className="text-4xl font-black text-[#081621] tracking-tighter">৳{totals.total.toFixed(2)}</span>
                   </div>
                   <div className="p-2 bg-primary/10 rounded-xl text-primary"><Calculator size={20}/></div>
                </div>
             </div>
           </div>
        </div>

        <DialogFooter className="p-4 md:p-6 bg-gray-50 border-t flex gap-2 shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold h-11 px-8">Discard</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-[#15435a] text-white rounded-xl px-12 font-black uppercase text-xs shadow-xl shadow-primary/20 h-11" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Authorize"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

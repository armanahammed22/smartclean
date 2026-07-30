'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDocs, updateDoc, where, setDoc, addDoc, limit } from 'firebase/firestore';
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
  User, 
  ShoppingCart, 
  Calculator, 
  Save, 
  Info,
  Package,
  ReceiptText
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

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

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
    setIsSubmitting(true);
    try {
      const invoiceData = {
        customerInfo: customer,
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
      toast({ title: "Operation Processed" });
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
        <header className="h-[70px] bg-[#081621] text-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/20 rounded-xl text-primary"><ReceiptText size={22} /></div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-tight">Invoice Terminal</DialogTitle>
              <DialogDescription className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                {editingInvoice ? 'UPDATING RECORD' : `CREATING NEW RECORD`}
              </DialogDescription>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
           {/* 👤 CUSTOMER DETAILS SECTION */}
           <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100">
             <CardContent className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-500 uppercase">Customer Name</Label>
                   <Select onValueChange={(val) => {
                     const c = clients?.find(i => i.id === val);
                     if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', address: c.address || '' });
                   }}>
                     <SelectTrigger className="h-10 bg-gray-50 border-none rounded-lg font-bold">
                       <SelectValue placeholder={customer.name || "Search customers..."} />
                     </SelectTrigger>
                     <SelectContent>
                       {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-500 uppercase">Invoice Number</Label>
                   <Input value={config.invoiceNumber} readOnly className="h-10 bg-gray-50 border-none rounded-lg" />
                 </div>
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-500 uppercase">Invoice Date</Label>
                   <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-10 bg-gray-50 border-none" />
                 </div>
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-500 uppercase">Due Date</Label>
                   <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-10 bg-gray-50 border-none" />
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* 📦 PRODUCT DETAILS SECTION */}
           <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100">
             <CardContent className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-xl">
                 <div className="md:col-span-7 space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase">Select Products</Label>
                   <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                     <SelectTrigger className="h-10 bg-white border-gray-200">
                       <SelectValue placeholder="Choose product..." />
                     </SelectTrigger>
                     <SelectContent>
                       {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="md:col-span-3 space-y-1.5">
                   <Label className="text-[10px] font-bold uppercase">Quantity</Label>
                   <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-10 bg-white" />
                 </div>
                 <Button type="button" onClick={handleAddItemToBill} className="md:col-span-2 h-10 bg-blue-600 font-bold">+ Add to Bill</Button>
               </div>

               <div className="rounded-xl border border-gray-100 overflow-hidden">
                 <Table>
                   <TableHeader className="bg-gray-50">
                     <TableRow>
                       <TableHead className="text-[10px] font-black uppercase py-4">Product Name</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-center">Quantity</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-right">Unit Price</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-right">Discount</TableHead>
                       <TableHead className="text-[10px] font-black uppercase text-right">Net Amount</TableHead>
                       <TableHead></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {items.map((item) => (
                       <TableRow key={item.id}>
                         <TableCell className="font-bold text-xs uppercase">{item.name}</TableCell>
                         <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', e.target.value)} className="h-8 w-20 mx-auto text-center" /></TableCell>
                         <TableCell><Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', e.target.value)} className="h-8 w-24 ml-auto text-right" /></TableCell>
                         <TableCell><Input type="number" value={item.discount} onChange={e => updateItemField(item.id, 'discount', e.target.value)} className="h-8 w-24 ml-auto text-right" /></TableCell>
                         <TableCell className="text-right font-black text-xs">৳{item.total.toFixed(2)}</TableCell>
                         <TableCell><button onClick={() => removeItem(item.id)}><Trash2 size={14} className="text-rose-300"/></button></TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
             <div className="lg:col-span-7 space-y-4">
               <Label className="text-[10px] font-black uppercase text-gray-500">Customers Notes</Label>
               <Textarea value={config.notes} onChange={e => setConfig({...config, notes: e.target.value})} className="h-32 bg-white rounded-xl" />
             </div>
             <div className="lg:col-span-5 bg-gray-50 p-6 rounded-2xl space-y-6">
                <div className="flex justify-between text-xs font-bold text-gray-600">
                  <span className="uppercase">Sub Total</span>
                  <span>{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                   <span className="text-[10px] font-black uppercase text-gray-400">Discount</span>
                   <div className="flex gap-1">
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 w-20 text-center" />
                      <Select value={pricing.discountType} onValueChange={(v:any) => setPricing({...pricing, discountType: v})}>
                         <SelectTrigger className="h-9 w-16"><SelectValue/></SelectTrigger>
                         <SelectContent><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">৳</SelectItem></SelectContent>
                      </Select>
                   </div>
                   <span className="text-rose-500 font-bold">-{totals.globalDiscountAmt.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2"><Switch checked={true} className="scale-75" /><span className="text-[10px] font-bold text-gray-400">TCS Applicable ?</span></div>
                  <span className="text-[10px] font-bold text-gray-400">0.00</span>
                </div>
                <div className="pt-6 border-t-2 border-gray-200 flex justify-between items-end">
                   <span className="text-lg font-black uppercase">Total Amount:</span>
                   <span className="text-2xl font-black text-gray-900">{totals.total.toFixed(2)}</span>
                </div>
             </div>
           </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t flex gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 rounded-xl px-10 font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Save and Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

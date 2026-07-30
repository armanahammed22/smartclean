'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, limit, serverTimestamp } from 'firebase/firestore';
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
  Check,
  Package,
  ShieldCheck,
  ReceiptText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature Modes
  const [isManualItem, setIsManualItem] = useState(false);

  // Selection state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1, unit: 'Qty' });

  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', delivery: 0, vatPercent: 0 });
  const [config, setConfig] = useState({ 
    invoiceNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: '' 
  });

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading: vLoading } = useDoc(invoiceRef);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const { data: services } = useCollection(servicesQuery);

  useEffect(() => {
    if (invoice) {
      setCustomer({
        id: invoice.customerId || '',
        name: invoice.customerInfo?.name || '',
        phone: invoice.customerInfo?.phone || '',
        email: invoice.customerInfo?.email || '',
        company: invoice.customerInfo?.company || '',
        address: invoice.customerInfo?.address || ''
      });
      setItems(invoice.items?.map((i: any) => ({
        ...i,
        id: i.id || Math.random().toString(),
        total: (i.price * i.quantity) - (i.discount || 0)
      })) || []);
      setPricing({
        discount: invoice.discount || 0,
        discountType: invoice.discountType || 'percentage',
        delivery: invoice.deliveryCharge || 0,
        vatPercent: invoice.vatPercent || 0
      });
      setConfig({
        invoiceNumber: invoice.invoiceNumber || '',
        issueDate: invoice.createdAt ? invoice.createdAt.split('T')[0] : '',
        expiryDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        notes: invoice.notes || ''
      });
    }
  }, [invoice]);

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

  const handleUpdate = async () => {
    if (!db || !invoiceRef) return;
    setIsSubmitting(true);
    try {
      const invoiceData = {
        customerInfo: { ...customer },
        items,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        total: totals.total,
        dueAmount: Math.max(0, totals.total - (invoice.paidAmount || 0)),
        createdAt: new Date(config.issueDate).toISOString(),
        dueDate: config.expiryDate ? new Date(config.expiryDate).toISOString() : null,
        notes: config.notes,
        updatedAt: serverTimestamp()
      };

      await updateDoc(invoiceRef, invoiceData);
      toast({ title: "Invoice Record Updated" });
      router.push('/admin/invoices');
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-4 pb-20 min-w-0">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">{config.invoiceNumber}</h1>
        </div>
        <Button onClick={handleUpdate} disabled={isSubmitting} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
          {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Update Invoice</>}
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><UserIcon size={12}/> Recipient Sync</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
                <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Mobile Number</Label>
                <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Invoice Date</Label>
                <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Due Date</Label>
                <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9" />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Full Address</Label>
                <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ShoppingCart size={12}/> Billing Matrix</CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border">
               <Label className="text-[8px] font-black uppercase text-primary">Manual Item</Label>
               <Switch checked={isManualItem} onCheckedChange={setIsManualItem} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
              {!isManualItem ? (
                <>
                  <div className="md:col-span-7 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Add Service</Label>
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
                    <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9" />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-5 space-y-1">
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
                      <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', e.target.value)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                          <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', e.target.value)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                      <TableCell><Input type="number" value={item.discount || 0} onChange={e => updateItemField(item.id, 'discount', e.target.value)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
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
            <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Ledger Remarks</Label>
            <Textarea value={config.notes} onChange={e => setConfig({...config, notes: e.target.value})} className="h-28 bg-white rounded-xl shadow-inner border-gray-100 p-4" />
          </div>
          <div className="lg:col-span-5 bg-slate-50 border border-gray-100 p-6 rounded-[1.5rem] space-y-4">
             <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <span>Gross Valuation</span>
               <span>৳{totals.subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center gap-4">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Global Adjustment</span>
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
                   <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Calculator size={22}/></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

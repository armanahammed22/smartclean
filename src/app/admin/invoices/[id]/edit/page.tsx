
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection, useUser } from '@/firebase';
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
  ReceiptText,
  Zap,
  Layers,
  Edit2,
  ListPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EntryMode = 'dynamic' | 'combo' | 'manual';

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // UI State
  const [entryMode, setEntryMode] = useState<EntryMode>('dynamic');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Data State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', delivery: 0, vatPercent: 0, manualTotal: 0 });
  const [config, setConfig] = useState({ 
    invoiceNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: ''
  });

  // Mode Specific States
  const [comboServices, setComboServices] = useState<string[]>(['']);
  const [comboTotalPrice, setComboTotalPrice] = useState('');
  const [manualRows, setManualRows] = useState<any[]>([{ name: '', price: '', quantity: 1, unit: 'Qty' }]);

  const invoiceRef = useMemoFirebase(() => (db && id) ? doc(db, 'invoices', id as string) : null, [db, id]);
  const { data: invoice, isLoading: vLoading } = useDoc(invoiceRef);

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active'), limit(100)) : null, [db]);
  const { data: servicesRaw } = useCollection(servicesQuery);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  useEffect(() => {
    if (invoice && !isInitialized) {
      const mode = (invoice.pricingMode || 'dynamic') as EntryMode;
      setEntryMode(mode);
      
      setCustomer({
        id: invoice.customerId || '',
        name: invoice.customerInfo?.name || '',
        phone: invoice.customerInfo?.phone || '',
        email: invoice.customerInfo?.email || '',
        company: invoice.customerInfo?.company || '',
        address: invoice.customerInfo?.address || ''
      });
      
      if (mode === 'dynamic') {
        setItems(invoice.items || []);
      } else if (mode === 'combo') {
        setComboServices(invoice.items?.map((i: any) => i.name) || ['']);
        setComboTotalPrice(invoice.subtotal?.toString() || '');
      } else if (mode === 'manual') {
        setManualRows(invoice.items?.map((i: any) => ({ ...i, price: i.price?.toString() })) || [{ name: '', price: '', quantity: 1, unit: 'Qty' }]);
      }
      
      setPricing({
        discount: invoice.discount || 0,
        discountType: invoice.discountType || 'percentage',
        delivery: invoice.deliveryCharge || 0,
        vatPercent: invoice.vatPercent || 0,
        manualTotal: invoice.total || 0
      });
      
      setConfig({
        invoiceNumber: invoice.invoiceNumber || '',
        issueDate: invoice.createdAt ? invoice.createdAt.split('T')[0] : '',
        expiryDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        notes: invoice.notes || ''
      });
      
      setIsInitialized(true);
    }
  }, [invoice, isInitialized]);

  const handleAddItemToBill = () => {
    const service = services.find(s => s.id === selectedProductId);
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

  const addComboRow = () => setComboServices([...comboServices, '']);
  const removeComboRow = (idx: number) => setComboServices(comboServices.filter((_, i) => i !== idx));
  const updateComboRow = (idx: number, val: string) => {
    const next = [...comboServices];
    next[idx] = val;
    setComboServices(next);
  };

  const addManualRow = () => setManualRows([...manualRows, { name: '', price: '', quantity: 1, unit: 'Qty' }]);
  const removeManualRow = (idx: number) => setManualRows(manualRows.filter((_, i) => i !== idx));
  const updateManualRow = (idx: number, field: string, val: any) => {
    const next = [...manualRows];
    next[idx][field] = val;
    setManualRows(next);
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
    let subtotal = 0;
    if (entryMode === 'dynamic') {
      subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    } else if (entryMode === 'combo') {
      subtotal = parseFloat(comboTotalPrice) || 0;
    } else {
      subtotal = manualRows.reduce((acc, i) => acc + ((parseFloat(i.price) || 0) * (i.quantity || 0)), 0);
    }

    const itemDiscounts = entryMode === 'dynamic' ? items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0) : 0;
    let globalDiscountAmt = pricing.discountType === 'percentage' ? (subtotal * (pricing.discount / 100)) : pricing.discount;
    const finalTotal = subtotal - itemDiscounts - globalDiscountAmt + pricing.delivery;

    return { subtotal, globalDiscountAmt, total: Math.max(0, finalTotal) };
  }, [entryMode, items, comboTotalPrice, manualRows, pricing]);

  const handleUpdate = async () => {
    if (!db || !invoiceRef) return;
    setIsSubmitting(true);

    let finalItems = [];
    if (entryMode === 'dynamic') finalItems = items;
    else if (entryMode === 'combo') finalItems = comboServices.filter(s => !!s).map(s => ({ name: s, itemType: 'combo_member', price: 0, quantity: 1 }));
    else finalItems = manualRows.filter(r => !!r.name).map(r => ({ ...r, price: parseFloat(r.price) || 0, itemType: 'manual' }));

    try {
      const invoiceData = {
        customerInfo: { ...customer },
        items: finalItems,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        total: totals.total,
        dueAmount: Math.max(0, totals.total - (invoice.paidAmount || 0)),
        createdAt: new Date(config.issueDate).toISOString(),
        dueDate: config.expiryDate ? new Date(config.expiryDate).toISOString() : null,
        notes: config.notes,
        pricingMode: entryMode,
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
    <div className="space-y-4 pb-24 min-w-0 -mt-6">
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

      {/* Entry Mode Switcher */}
      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border shadow-sm">
        {(['dynamic', 'combo', 'manual'] as EntryMode[]).map(m => (
          <button key={m} type="button" onClick={() => setEntryMode(m)} className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all", entryMode === m ? "bg-primary text-white shadow-lg" : "bg-gray-50 text-gray-400")}>
            {m === 'dynamic' ? <Zap size={14}/> : m === 'combo' ? <Layers size={14}/> : <Edit2 size={14}/>} {m}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b">
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

        <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b">
            <CardTitle className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><ShoppingCart size={12}/> Item Matrix ({entryMode.toUpperCase()})</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {entryMode === 'dynamic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                  <div className="md:col-span-7 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Add Service</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 bg-white border-gray-200">
                        <SelectValue placeholder="Choose product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area Qty</Label>
                    <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" />
                  </div>
                  <Button type="button" onClick={handleAddItemToBill} className="md:col-span-2 h-9 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-tight shadow-md">+ Add to Bill</Button>
                </div>
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit/Area</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-right w-24">Rate</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-right w-28">Net Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id || idx}>
                        <TableCell className="font-bold text-[11px] uppercase py-2">{item.name}</TableCell>
                        <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', e.target.value)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                        <TableCell>
                          <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                            <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>{['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', e.target.value)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                        <TableCell className="text-right font-black text-[11px] text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</TableCell>
                        <TableCell><button onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600"><Trash2 size={14}/></button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {entryMode === 'combo' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase text-gray-400">Included Services (Custom List)</Label>
                  {comboServices.map((s, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={s} onChange={e => updateComboRow(idx, e.target.value)} placeholder="Type service name..." className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs shadow-inner" />
                      {comboServices.length > 1 && <button onClick={() => removeComboRow(idx)} className="text-rose-400 hover:text-rose-600"><X size={18}/></button>}
                    </div>
                  ))}
                  <Button type="button" onClick={addComboRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><Plus size={14} /> Add Service Entry</Button>
                </div>
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                   <Label className="text-[10px] font-black uppercase text-indigo-700">One Time Package Bill (৳)</Label>
                   <Input type="number" value={comboTotalPrice} onChange={e => setComboTotalPrice(e.target.value)} className="h-12 w-48 bg-white border-none rounded-xl font-black text-lg text-indigo-700 text-right shadow-sm" />
                </div>
              </div>
            )}

            {entryMode === 'manual' && (
              <div className="space-y-4">
                <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Service/Product</TableHead><TableHead className="text-center w-24 uppercase">Price</TableHead><TableHead className="text-center w-20 uppercase">Qty</TableHead><TableHead className="text-center w-24 uppercase">Unit</TableHead><TableHead className="text-right w-28 uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>{manualRows.map((row, idx) => (
                    <TableRow key={idx}><TableCell><Input value={row.name} onChange={e => updateManualRow(idx, 'name', e.target.value)} className="h-8 text-xs font-bold bg-gray-50 border-none" placeholder="Description" /></TableCell>
                      <TableCell><Input type="number" value={row.price} onChange={e => updateManualRow(idx, 'price', e.target.value)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                      <TableCell><Input type="number" value={row.quantity} onChange={e => updateManualRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                      <TableCell><Select value={row.unit} onValueChange={v => updateManualRow(idx, 'unit', v)}><SelectTrigger className="h-8 text-[10px] uppercase font-black"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Qty">Qty</SelectItem><SelectItem value="Sqft">Sqft</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Room">Room</SelectItem></SelectContent></Select></TableCell>
                      <TableCell className="text-right font-black text-xs text-primary">৳{((parseFloat(row.price) || 0) * row.quantity).toLocaleString()}</TableCell>
                      <TableCell><button onClick={() => removeManualRow(idx)} className="text-rose-400"><X size={16}/></button></TableCell></TableRow>))}</TableBody>
                </Table>
                <Button type="button" onClick={addManualRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><ListPlus size={14} /> Add New Row</Button>
              </div>
            )}
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
               <span>৳{totals.subtotal.toLocaleString()}</span>
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
             <div className="pt-5 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Net Final Bill</span>
                   <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toLocaleString()}</span>
                </div>
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Calculator size={22}/></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

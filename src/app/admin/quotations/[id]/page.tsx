
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Zap, 
  FileText, 
  CheckCircle2, 
  ShoppingCart,
  X,
  Wrench,
  Info,
  Calculator,
  Users,
  MapPin,
  Settings2,
  FileSpreadsheet,
  Layers,
  Download,
  Eye,
  ListChecks,
  Printer,
  Edit2,
  ListPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { convertQuotationToBooking, convertQuotationToInvoice, downloadQuotationPDF } from '@/lib/quotation-utils';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

type EntryMode = 'dynamic' | 'combo' | 'manual';

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // UI State
  const [entryMode, setEntryMode] = useState<EntryMode>('dynamic');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Data State
  const [customer, setCustomer] = useState<any>({ name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>({ discount: 0, discountType: 'percentage', additional: 0, vatPercent: 0, manualTotal: 0 });
  const [config, setConfig] = useState<any>({ issueDate: '', expiryDate: '', terms: [] as string[], status: 'Draft', salesPerson: '', footerServices: '', tagline: '' });

  // Mode Specific States
  const [comboServices, setComboServices] = useState<string[]>(['']);
  const [comboTotalPrice, setComboTotalPrice] = useState('');
  const [manualRows, setManualRows] = useState<any[]>([{ name: '', price: '', quantity: 1, unit: 'Qty' }]);

  const quoteRef = useMemoFirebase(() => (db && id && id !== 'new') ? doc(db, 'quotations', id as string) : null, [db, id]);
  const { data: quote, isLoading: qLoading } = useDoc(quoteRef);

  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const { data: servicesRaw } = useCollection(servicesRef);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  useEffect(() => {
    if (quote && !isInitialized) {
      const mode = (quote.pricingMode || 'dynamic') as EntryMode;
      setEntryMode(mode);
      setCustomer(quote.customerInfo || {});
      
      if (mode === 'dynamic') {
        setItems(quote.items || []);
      } else if (mode === 'combo') {
        setComboServices(quote.items?.map((i: any) => i.name) || ['']);
        setComboTotalPrice(quote.subtotal?.toString() || '');
      } else if (mode === 'manual') {
        setManualRows(quote.items?.map((i: any) => ({ ...i, price: i.price?.toString() })) || [{ name: '', price: '', quantity: 1, unit: 'Qty' }]);
      }
      
      setPricing({ 
        discount: quote.discount || 0, 
        discountType: quote.discountType || 'percentage', 
        additional: quote.additionalCharges || 0, 
        vatPercent: quote.vatPercent || 0,
        manualTotal: quote.total || 0 
      });
      
      setConfig({ 
        issueDate: quote.issueDate || '', 
        expiryDate: quote.expiryDate || '', 
        terms: Array.isArray(quote.terms) ? quote.terms : [quote.terms || ''], 
        status: quote.status || 'Draft',
        salesPerson: quote.salesPerson || '',
        footerServices: quote.footerServices || '',
        tagline: quote.tagline || ''
      });
      
      setIsInitialized(true);
    }
  }, [quote, isInitialized]);

  const handleAddDynamic = () => {
    const service = services.find(s => s.id === selectedProductId);
    if (!service) return;
    const newItem = {
      id: service.id + '-' + Date.now(),
      serviceId: service.id,
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

  const totals = useMemo(() => {
    let subtotal = 0;
    if (entryMode === 'dynamic') {
      subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    } else if (entryMode === 'combo') {
      subtotal = parseFloat(comboTotalPrice) || 0;
    } else {
      subtotal = manualRows.reduce((acc, i) => acc + ((parseFloat(i.price) || 0) * (i.quantity || 0)), 0);
    }

    let discountAmt = pricing.discountType === 'percentage' ? (subtotal * (pricing.discount / 100)) : pricing.discount;
    const total = subtotal - discountAmt + (pricing.additional || 0);
    return { subtotal, discountAmt, total };
  }, [entryMode, items, comboTotalPrice, manualRows, pricing]);

  const handleUpdate = async () => {
    if (!db || !quoteRef) return;
    setIsSaving(true);

    let finalItems = [];
    if (entryMode === 'dynamic') finalItems = items;
    else if (entryMode === 'combo') finalItems = comboServices.filter(s => !!s).map(s => ({ name: s, itemType: 'combo_member', price: 0, quantity: 1 }));
    else finalItems = manualRows.filter(r => !!r.name).map(r => ({ ...r, price: parseFloat(r.price) || 0, itemType: 'manual' }));

    try {
      await updateDoc(quoteRef, {
        customerInfo: customer,
        items: finalItems,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        additionalCharges: pricing.additional,
        total: totals.total,
        pricingMode: entryMode,
        ...config,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Quotation Updated" });
      router.push('/admin/quotations');
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (qLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Protocol...</p></div>;

  return (
    <div className="space-y-4 pb-24 min-w-0 -mt-6">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-9 w-9 border hover:bg-gray-50">
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">{quote?.quoteNumber}</h1>
        </div>
        <div className="flex gap-2">
           <Button onClick={handleUpdate} disabled={isSaving} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
             {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Sync Changes</>}
           </Button>
        </div>
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
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Users size={12} /> Client Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Customer Name</Label>
                <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="h-9 font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Phone Number</Label>
                <Input value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Issue Date</Label>
                <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Expiry Date</Label>
                <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-9" />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-[9px] font-bold text-gray-400 uppercase">Site Address</Label>
                <Input value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="h-9" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <ShoppingCart size={12} /> Item Matrix ({entryMode.toUpperCase()})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {entryMode === 'dynamic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
                  <div className="md:col-span-7 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Select Items</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 bg-white border-gray-200">
                        <SelectValue placeholder="Choose standard service..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Unit/Area Qty</Label>
                    <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-9 bg-white" />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" onClick={handleAddDynamic} className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase gap-2">
                      <Plus size={14} /> Add Item
                    </Button>
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-none">
                      <TableHead className="text-[9px] font-black uppercase py-3">Item Name</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit/Area</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-center w-24">Unit</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-right w-24">Rate</TableHead>
                      <TableHead className="text-[9px] font-black uppercase text-right w-28">Subtotal</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.id || idx}>
                        <TableCell className="py-3 font-bold text-[11px] text-gray-900 uppercase">{item.name}</TableCell>
                        <TableCell><Input type="number" value={item.quantity} onChange={e => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-7 w-16 mx-auto text-center font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                        <TableCell>
                          <Select value={item.unit} onValueChange={v => updateItemField(item.id, 'unit', v)}>
                            <SelectTrigger className="h-7 w-20 mx-auto text-[9px] font-black uppercase bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>{['Qty', 'Sqft', 'Pcs', 'Unit', 'Hour', 'Room'].map(u => <SelectItem key={u} value={u} className="text-[10px] font-black uppercase">{u}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Input type="number" value={item.price} onChange={e => updateItemField(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-7 w-20 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" /></TableCell>
                        <TableCell className="text-right font-black text-[11px] text-gray-900">৳{(item.price * item.quantity).toLocaleString()}</TableCell>
                        <TableCell><button type="button" onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button></TableCell>
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
                   <Label className="text-[10px] font-black uppercase text-indigo-700">Combined Package Rate (৳)</Label>
                   <Input type="number" value={comboTotalPrice} onChange={e => setComboTotalPrice(e.target.value)} className="h-12 w-48 bg-white border-none rounded-xl font-black text-lg text-indigo-700 text-right shadow-sm" />
                </div>
              </div>
            )}

            {entryMode === 'manual' && (
              <div className="space-y-4">
                <Table><TableHeader><TableRow><TableHead className="text-[10px] uppercase">Service Name</TableHead><TableHead className="text-center w-24 uppercase">Rate</TableHead><TableHead className="text-center w-20 uppercase">Qty</TableHead><TableHead className="text-center w-24 uppercase">Unit</TableHead><TableHead className="text-right w-28 uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                  <TableBody>{manualRows.map((row, idx) => (
                    <TableRow key={idx}><TableCell><Input value={row.name} onChange={e => updateManualRow(idx, 'name', e.target.value)} className="h-8 text-xs font-bold bg-gray-50 border-none" placeholder="Service Name" /></TableCell>
                      <TableCell><Input type="number" value={row.price} onChange={e => updateManualRow(idx, 'price', e.target.value)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                      <TableCell><Input type="number" value={row.quantity} onChange={e => updateManualRow(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-center text-xs font-black bg-gray-50 border-none" /></TableCell>
                      <TableCell><Select value={row.unit} onValueChange={v => updateManualRow(idx, 'unit', v)}><SelectTrigger className="h-8 text-[10px] uppercase font-black"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Qty">Qty</SelectItem><SelectItem value="Sqft">Sqft</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Room">Room</SelectItem></SelectContent></Select></TableCell>
                      <TableCell className="text-right font-black text-xs text-primary">৳{((parseFloat(row.price) || 0) * row.quantity).toLocaleString()}</TableCell>
                      <TableCell><button onClick={() => removeManualRow(idx)} className="text-rose-400"><X size={16}/></button></TableCell></TableRow>))}</TableBody>
                </Table>
                <Button type="button" onClick={addManualRow} variant="outline" className="w-full h-9 border-dashed border-2 rounded-xl text-[9px] font-black uppercase text-gray-400"><ListPlus size={14} /> Add Manual Row</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Terms & Conditions Registry</Label>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                  {config.terms.map((term: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-8 border-none bg-gray-50 text-[10px] font-medium" />
                      <button type="button" onClick={() => removeTerm(i)} className="p-1.5 text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0"><X size={12}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={addTerm} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-lg h-9 text-[9px] font-black uppercase text-gray-400 hover:text-primary hover:border-primary">
                    <Plus size={12}/> Add Custom Line
                  </button>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Status Control</Label>
                <Select value={config.status} onValueChange={v => setConfig({...config, status: v})}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 rounded-xl font-bold text-xs uppercase"><SelectValue/></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {['Draft', 'Sent', 'Approved', 'Rejected', 'Expired', 'Converted'].map(s => <SelectItem key={s} value={s} className="text-xs uppercase font-bold py-2">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-xl rounded-2xl bg-slate-50 border border-gray-100 overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Gross Estimation</span>
                  <span>৳{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                   <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Global Adjustment</span>
                   <div className="flex gap-1">
                      <Input type="number" value={pricing.discount} onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})} className="h-9 w-20 bg-white border-gray-200 text-center font-black text-rose-600 shadow-sm" />
                      <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                         <SelectTrigger className="h-9 w-14 bg-white border-gray-200 text-xs font-black"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-xl"><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">৳</SelectItem></SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="pt-6 border-t border-gray-200 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Proposed Final Amount</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm"><Calculator size={22}/></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function updateTerm(idx: number, val: string, config: any, setConfig: any) {
  const next = [...config.terms];
  next[idx] = val;
  setConfig({ ...config, terms: next });
}

function addTerm(config: any, setConfig: any) {
  setConfig({ ...config, terms: [...config.terms, ''] });
}

function removeTerm(idx: number, config: any, setConfig: any) {
  setConfig({ ...config, terms: config.terms.filter((_: any, i: number) => i !== idx) });
}

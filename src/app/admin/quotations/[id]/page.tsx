'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, orderBy, getDoc, serverTimestamp } from 'firebase/firestore';
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
  Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { convertQuotationToBooking, convertQuotationToInvoice, downloadQuotationPDF } from '@/lib/quotation-utils';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isManualItem, setIsManualItem] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', price: '', quantity: 1, unit: 'Qty' });
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const quoteRef = useMemoFirebase(() => (db && id && id !== 'new') ? doc(db, 'quotations', id as string) : null, [db, id]);
  const { data: quote, isLoading: qLoading } = useDoc(quoteRef);

  const servicesRef = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const { data: servicesRaw } = useCollection(servicesRef);

  const services = useMemo(() => {
    return servicesRaw?.sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const [customer, setCustomer] = useState<any>({ name: '', phone: '', email: '', company: '', address: '' });
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>({ discount: 0, discountType: 'percentage', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState<any>({ issueDate: '', expiryDate: '', terms: [] as string[], status: 'Draft', salesPerson: '', footerServices: '', tagline: '' });

  useEffect(() => {
    if (quote) {
      setCustomer(quote.customerInfo || {});
      // 🛡️ Ensure every item has a stable unique ID to prevent React "key" errors
      const itemsWithIds = (quote.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `quote-item-${idx}-${Date.now()}`
      }));
      setItems(itemsWithIds);
      setPricing({ 
        discount: quote.discount || 0, 
        discountType: quote.discountType || 'percentage', 
        additional: quote.additionalCharges || 0, 
        vatPercent: quote.vatPercent || 0 
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
    }
  }, [quote]);

  const handleAddItemToBill = () => {
    if (isManualItem) {
      if (!manualItem.name || !manualItem.price) return;
      const newItem = {
        id: 'manual-' + Date.now(),
        name: manualItem.name,
        price: parseFloat(manualItem.price) || 0,
        quantity: manualItem.quantity,
        unit: manualItem.unit,
        discount: 0,
        total: (parseFloat(manualItem.price) || 0) * manualItem.quantity
      };
      setItems([...items, newItem]);
      setManualItem({ name: '', price: '', quantity: 1, unit: 'Qty' });
    } else {
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
    }
  };

  const removeItem = (itemId: string) => setItems(items.filter(i => i.id !== itemId));
  
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

  const addTerm = () => setConfig({ ...config, terms: [...config.terms, ''] });
  const updateTerm = (idx: number, val: string) => {
    const next = [...config.terms];
    next[idx] = val;
    setConfig({ ...config, terms: next });
  };
  const removeTerm = (idx: number) => setConfig({ ...config, terms: config.terms.filter((_, i) => i !== idx) });

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    let discountAmt = pricing.discountType === 'percentage' ? (subtotal * (pricing.discount / 100)) : pricing.discount;
    const net = subtotal - discountAmt;
    const taxAmt = net * (pricing.vatPercent / 100);
    const total = net + taxAmt + (pricing.additional || 0);
    return { subtotal, discountAmt, taxAmt, total };
  }, [items, pricing]);

  const handleUpdate = async () => {
    if (!db || !quoteRef) return;
    setIsSaving(true);
    try {
      await updateDoc(quoteRef, {
        customerInfo: customer,
        items,
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        additionalCharges: pricing.additional,
        vatPercent: pricing.vatPercent,
        tax: totals.taxAmt,
        total: totals.total,
        ...config,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Quotation Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!db || !quote) return;
    setIsConverting(true);
    try {
      const invId = await convertQuotationToInvoice(db, quote);
      toast({ title: "Invoice Created", description: "Quotation has been successfully converted to an invoice." });
      router.push(`/admin/invoices/${invId}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Conversion Failed" });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!quote?.quoteNumber) return;
    window.open(`/quotation/${quote.quoteNumber}?download=true`, '_blank');
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
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-9 px-4 rounded-lg font-black uppercase text-[10px] bg-white border-primary/20 text-primary gap-2 shadow-sm" asChild>
             <Link href={`/quotation/${quote?.quoteNumber}`} target="_blank"><Eye size={14}/> View</Link>
           </Button>
           <Button variant="outline" onClick={handleDownload} className="h-9 px-4 rounded-lg font-black uppercase text-[10px] bg-white border-primary/20 text-indigo-600 gap-2 shadow-sm">
             <Download size={14}/> PDF</Button>
           <Button 
             variant="outline"
             onClick={handleConvertToInvoice} 
             disabled={isConverting || quote?.status === 'Converted'} 
             className="h-9 px-4 rounded-lg font-black uppercase text-[10px] bg-blue-50 border-blue-200 text-blue-700 gap-2 shadow-sm hover:bg-blue-100"
           >
             {isConverting ? <Loader2 className="animate-spin h-3 w-3" /> : <Printer size={14} />} 
             {quote?.status === 'Converted' ? 'Invoiced' : 'Convert to Invoice'}
           </Button>
           <Button onClick={handleUpdate} disabled={isSaving} className="h-9 px-8 rounded-lg font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2 active:scale-95 transition-all">
             {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : <><Save size={14} /> Sync Changes</>}
           </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
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

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-3 px-5 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <ShoppingCart size={12} /> Item Correction
            </CardTitle>
            <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-full border shadow-inner">
               <Label className="text-[8px] font-black uppercase text-primary">Manual Entry</Label>
               <Switch checked={isManualItem} onCheckedChange={setIsManualItem} className="scale-75" />
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl border">
              {!isManualItem ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-[9px] font-bold uppercase text-gray-400">Manual Name</Label>
                    <Input value={manualItem.name} onChange={e => setManualItem({...manualItem, name: e.target.value})} placeholder="Service Name" className="h-9 bg-white" />
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
              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItemToBill} className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase gap-2">
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
                    <TableHead className="text-[9px] font-black uppercase text-right w-28">Subtotal</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id || idx} className="hover:bg-gray-50/30">
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
                        <Input type="number" value={item.discount} onChange={e => updateItemField(item.id, 'discount', parseFloat(e.target.value) || 0)} className="h-7 w-24 ml-auto text-right font-bold text-[11px] bg-white shadow-inner rounded-lg" />
                      </TableCell>
                      <TableCell className="text-right font-black text-[11px] text-gray-900">৳{item.total?.toFixed(2)}</TableCell>
                      <TableCell><button type="button" onClick={() => removeItem(item.id)} className="p-1 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={14}/></button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Terms & Registry</Label>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                  {config.terms.map((term: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-8 border-none bg-gray-50 text-[10px] font-medium" />
                      <button type="button" onClick={() => removeTerm(i)} className="p-1.5 text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0"><X size={12}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={addTerm} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-lg h-9 text-[9px] font-black uppercase text-gray-400 hover:text-primary hover:border-primary">
                    <Plus size={12}/> Add Custom Rule
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
                  <span>Sub-Total</span>
                  <span>৳{totals.subtotal.toFixed(2)}</span>
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
                    <span className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Grand Final Value</span>
                    <span className="text-4xl font-black text-[#081621] tracking-tighter italic">৳{totals.total.toFixed(2)}</span>
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

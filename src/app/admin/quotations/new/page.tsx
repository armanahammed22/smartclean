'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, where, doc, setDoc, updateDoc } from 'firebase/firestore';
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
  User, 
  ShoppingCart,
  X,
  FileSpreadsheet,
  ListChecks,
  Calendar as CalendarIcon,
  Zap,
  Calculator,
  Search,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNextQuotationNumber } from '@/lib/quotation-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CreateQuotationPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');

  // Form State
  const [customer, setCustomer] = useState({ id: '', name: '', phone: '', email: '', company: '', address: '' });
  
  // Selection Helper State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState({ discount: 0, discountType: 'percentage' as 'percentage' | 'fixed', additional: 0, vatPercent: 0 });
  const [config, setConfig] = useState({ 
    issueDate: new Date().toISOString().split('T')[0], 
    expiryDate: '', 
    terms: [] as string[], 
    salesPerson: user?.displayName || '',
    footerServices: '',
    customerNotes: ''
  });

  // Data Fetch
  const servicesRef = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const customersRef = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'quotation') : null, [db]);

  const { data: servicesRaw } = useCollection(servicesRef);
  const { data: customersRaw } = useCollection(customersRef);
  const { data: quoteSettings } = useDoc(settingsRef);

  const services = useMemo(() => {
    return servicesRaw?.filter(s => s.status === 'Active').sort((a, b) => (a.title || '').localeCompare(b.title || '')) || [];
  }, [servicesRaw]);

  const clients = useMemo(() => {
    return customersRaw?.filter(c => c.role === 'customer').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [customersRaw]);

  useEffect(() => {
    if (db) {
      getNextQuotationNumber(db).then(setQuoteNumber);
    }
  }, [db]);

  useEffect(() => {
    if (quoteSettings) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + (quoteSettings.defaultValidityDays || 7));
      setConfig(prev => ({ 
        ...prev, 
        expiryDate: expiry.toISOString().split('T')[0],
        terms: Array.isArray(quoteSettings.defaultTerms) ? quoteSettings.defaultTerms : [quoteSettings.defaultTerms || ''],
        footerServices: quoteSettings.defaultFooterServices || ''
      }));
    }
  }, [quoteSettings]);

  const handleAddItemToBill = () => {
    const service = services.find(s => s.id === selectedProductId);
    if (!service) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select a product or service first." });
      return;
    }

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

  const addTerm = () => setConfig({ ...config, terms: [...config.terms, ''] });
  const updateTerm = (idx: number, val: string) => {
    const next = [...config.terms];
    next[idx] = val;
    setConfig({ ...config, terms: next });
  };
  const removeTerm = (idx: number) => setConfig({ ...config, terms: config.terms.filter((_, i) => i !== idx) });

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (parseFloat(i.quantity) || 0), 0);
    const itemDiscounts = items.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
    
    let globalDiscountAmt = pricing.discountType === 'percentage' 
      ? (subtotal * (pricing.discount / 100)) 
      : pricing.discount;
      
    const finalTotal = subtotal - itemDiscounts - globalDiscountAmt + (pricing.additional || 0);

    return { subtotal, itemDiscounts, globalDiscountAmt, total: Math.max(0, finalTotal) };
  }, [items, pricing]);

  const handleSave = async (status: string) => {
    if (!db) return;
    if (!customer.name || items.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Customer and items are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        quoteNumber,
        customerId: customer.id || null,
        customerInfo: customer,
        items: items.map(i => ({ ...i, price: parseFloat(i.price) || 0, quantity: parseFloat(i.quantity) || 1, discount: parseFloat(i.discount) || 0 })),
        subtotal: totals.subtotal,
        discount: pricing.discount,
        discountType: pricing.discountType,
        total: totals.total,
        status,
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'quotations'), finalData);
      router.push('/admin/quotations');
      toast({ title: "Quotation Generated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 min-w-0">
      {/* 🟢 TOP ACTION BAR */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg h-10 w-10 border hover:bg-gray-50">
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Create Quotation</h1>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => handleSave('Draft')} disabled={isSubmitting} className="h-10 px-6 rounded-lg font-bold text-xs">Save as Draft</Button>
           <Button onClick={() => handleSave('Sent')} disabled={isSubmitting} className="h-10 px-8 rounded-lg font-black uppercase text-xs bg-primary text-white shadow-lg">
             {isSubmitting ? <Loader2 className="animate-spin" /> : "Save and Send"}
           </Button>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* 👤 CUSTOMER DETAILS SECTION */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-4 border-b">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <User size={14} /> Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Customer Name</Label>
                <Select onValueChange={(val) => {
                  const c = clients?.find(i => i.id === val);
                  if (c) setCustomer({ id: c.id, name: c.name || '', phone: c.phone || '', email: c.email || '', company: c.company || '', address: c.address || '' });
                }}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 rounded-lg shadow-sm">
                    <SelectValue placeholder="Search customers..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {clients?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Quote Number</Label>
                <Input value={quoteNumber} readOnly className="h-10 bg-gray-50 border-gray-200 rounded-lg font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Invoice Date</Label>
                <Input type="date" value={config.issueDate} onChange={e => setConfig({...config, issueDate: e.target.value})} className="h-10 bg-white border-gray-200 rounded-lg text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Due Date</Label>
                <Input type="date" value={config.expiryDate} onChange={e => setConfig({...config, expiryDate: e.target.value})} className="h-10 bg-white border-gray-200 rounded-lg text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📦 PRODUCT DETAILS SECTION */}
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden border border-gray-100">
          <CardHeader className="bg-gray-50/50 p-4 border-b">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-500">
              <ShoppingCart size={14} /> Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border">
              <div className="md:col-span-7 space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Select Products</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-10 bg-white border-gray-200 rounded-lg">
                    <SelectValue placeholder="Choose product..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs uppercase font-bold">{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Quantity</Label>
                <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className="h-10 bg-white" />
              </div>
              <div className="md:col-span-2">
                <Button type="button" onClick={handleAddItemToBill} className="w-full h-10 rounded-lg bg-blue-600 text-white font-bold text-xs gap-2">
                  <Plus size={16} /> Add to Bill
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="border-none">
                    <TableHead className="text-[10px] font-black uppercase py-4">Product Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center w-32">Quantity</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right w-32">Unit Price</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right w-40">Discount (Total Amount)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right w-32">Net Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/30">
                      <TableCell className="py-4">
                        <p className="font-bold text-xs text-gray-900 uppercase">{item.name}</p>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={e => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="h-9 w-24 mx-auto text-center font-bold text-xs" 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.price} 
                          onChange={e => updateItemField(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="h-9 w-24 ml-auto text-right font-bold text-xs" 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.discount} 
                          onChange={e => updateItemField(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="h-9 w-32 ml-auto text-right font-bold text-xs" 
                        />
                      </TableCell>
                      <TableCell className="text-right font-black text-xs text-gray-900">
                        ৳{item.total?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center text-gray-300 italic text-xs uppercase tracking-widest">No items added to bill.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 📝 FOOTER NOTES & TOTALS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Customers Notes</Label>
              <Textarea 
                value={config.customerNotes} 
                onChange={e => setConfig({...config, customerNotes: e.target.value})}
                placeholder="Message displayed on invoice..." 
                className="min-h-[100px] rounded-xl border-gray-200 bg-white" 
              />
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Terms & Conditions</Label>
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                {config.terms.map((term, i) => (
                  <div key={i} className="flex gap-2 group">
                    <Input value={term} onChange={e => updateTerm(i, e.target.value)} className="h-9 border-none bg-gray-50 text-xs font-medium" />
                    <button type="button" onClick={() => removeTerm(i)} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                  </div>
                ))}
                <button type="button" onClick={addTerm} className="w-full flex items-center justify-center gap-2 border-dashed border-2 rounded-xl h-10 text-[10px] font-black uppercase text-gray-400 hover:text-primary hover:border-primary transition-all">
                  <Plus size={14}/> Add Term
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-none shadow-sm rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center text-sm font-bold text-gray-600">
                  <span className="uppercase tracking-widest text-[10px]">Sub Total</span>
                  <span className="text-gray-900">{totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center gap-6">
                  <span className="uppercase tracking-widest text-[10px] font-bold text-gray-600">Discount</span>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={pricing.discount} 
                      onChange={e => setPricing({...pricing, discount: parseFloat(e.target.value) || 0})}
                      className="h-10 w-20 bg-white text-center font-black" 
                    />
                    <Select value={pricing.discountType} onValueChange={(v: any) => setPricing({...pricing, discountType: v})}>
                      <SelectTrigger className="h-10 w-16 bg-white border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">৳</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="text-rose-500 font-bold">-{totals.globalDiscountAmt.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Switch className="scale-75" />
                    <span className="text-[10px] font-black uppercase text-gray-400">TDS Applicable ?</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">0.00</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={true} className="scale-75 data-[state=checked]:bg-blue-600" />
                    <span className="text-[10px] font-black uppercase text-gray-400">TCS Applicable ?</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">0.00</span>
                </div>

                <div className="pt-8 flex justify-between items-end border-t-2 border-gray-200">
                  <span className="text-lg font-black uppercase tracking-tight text-[#081621]">Total Amount:</span>
                  <span className="text-2xl font-black text-[#081621] tracking-tighter">{totals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

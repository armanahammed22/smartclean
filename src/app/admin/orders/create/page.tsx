
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  ShoppingCart, 
  Search, 
  User, 
  MapPin, 
  Package, 
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrCreateInvoice } from '@/lib/invoice-utils';

export default function CreateManualOrderPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Customer Data
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', notes: '' });
  
  // Selected Items
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // DB Fetch
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const { data: allProducts, isLoading: pLoading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !selectedItems.find(item => item.id === p.id)
    );
  }, [allProducts, searchTerm, selectedItems]);

  const addItem = (product: any) => {
    setSelectedItems([...selectedItems, {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      itemType: 'product'
    }]);
    setSearchTerm('');
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const next = [...selectedItems];
    next[idx][field] = value;
    setSelectedItems(next);
  };

  const removeItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const subtotal = useMemo(() => selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [selectedItems]);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal + tax;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (selectedItems.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty", description: "Select at least one product." });
      return;
    }
    if (!customer.name || !customer.phone || !customer.address) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Customer name, phone and address are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customer.name,
        customerPhone: customer.phone,
        address: customer.address,
        items: selectedItems,
        subtotal,
        tax,
        totalPrice: total,
        status: 'New',
        paymentMethod: 'Cash on Delivery (Manual)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Auto-generate invoice
      await getOrCreateInvoice(db, docRef.id, 'order', orderData);

      toast({ title: "Order Created", description: "Manual order and invoice generated successfully." });
      router.push('/admin/orders');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create order." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">Admin Sell</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Manual Order Creation</p>
        </div>
      </div>

      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Item Selector */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" /> Select Products
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  placeholder="Search product name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 pl-12 bg-gray-50 border-none rounded-2xl font-bold"
                />
                {searchTerm && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                    {filteredProducts.map(p => (
                      <button key={p.id} type="button" onClick={() => addItem(p)} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b last:border-none text-left">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={20} /></div>
                        <div className="flex-1">
                          <p className="font-black text-xs uppercase">{p.name}</p>
                          <p className="text-[10px] font-bold text-primary">৳{p.price}</p>
                        </div>
                        <Plus size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-xs uppercase truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground">UNIT PRICE: ৳{item.price}</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Price</Label>
                        <Input 
                          type="number" 
                          value={item.price} 
                          onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} 
                          className="h-10 w-24 bg-white font-black text-xs border-none shadow-inner rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Qty</Label>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} 
                          className="h-10 w-16 bg-white font-black text-xs border-none shadow-inner rounded-xl"
                        />
                      </div>
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeItem(idx)} className="mt-4 text-destructive hover:bg-red-50 rounded-xl">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {selectedItems.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-3">
                    <ShoppingCart size={48} />
                    <p className="text-xs font-black uppercase tracking-widest">No Items Selected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User size={18} className="text-primary" /> Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                <Input 
                  value={customer.name} 
                  onChange={e => setCustomer({...customer, name: e.target.value})} 
                  placeholder="e.g. Karim Ahmed" 
                  className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                <Input 
                  value={customer.phone} 
                  onChange={e => setCustomer({...customer, phone: e.target.value})} 
                  placeholder="01XXXXXXXXX" 
                  className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-muted-foreground" size={18} />
                  <Textarea 
                    value={customer.address} 
                    onChange={e => setCustomer({...customer, address: e.target.value})} 
                    placeholder="House, Road, Block, Area" 
                    className="min-h-[100px] pl-12 bg-gray-50 border-none rounded-2xl font-medium pt-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          {/* Summary Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white border-t-8 border-primary">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Items ({selectedItems.length})</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>VAT (8%)</span>
                  <span>৳{tax.toLocaleString()}</span>
                </div>
                <div className="pt-6 border-t-2 border-dashed border-gray-100 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Grand Total</p>
                  <p className="text-5xl font-black text-primary tracking-tighter">৳{total.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-primary mt-0.5" />
                  <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase">
                    Admin override mode active. Manual invoice will be generated instantly.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 md:h-20 rounded-2xl font-black text-2xl bg-primary hover:bg-primary/90 text-white uppercase tracking-tight shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-transform"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={24} /> Confirm Sale</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

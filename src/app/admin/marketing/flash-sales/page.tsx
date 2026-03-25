
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Save, 
  Loader2, 
  Timer,
  Layout,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function FlashSalesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const flashRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'flash_sale') : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(flashRef);

  const productsRef = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const { data: allProducts } = useCollection(productsRef);

  const [formData, setFormData] = useState({
    title: 'Flash Sale',
    endDate: '',
    isActive: false,
    productIds: [] as string[]
  });

  useEffect(() => {
    if (config) {
      setFormData({
        title: config.title || 'Flash Sale',
        endDate: config.endDate || '',
        isActive: !!config.isActive,
        productIds: config.productIds || []
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'flash_sale'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Flash Sale Updated", description: "Changes are now live on the homepage." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProduct = (pid: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(pid) 
        ? prev.productIds.filter(id => id !== pid) 
        : [...prev.productIds, pid]
    }));
  };

  const filteredProducts = allProducts?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  if (configLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Flash Sale Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Create urgent, high-conversion limited time offers</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter bg-amber-500 hover:bg-amber-600 text-black">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Publish Flash Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-3">
                  <Zap className="text-amber-400" size={24} fill="currentColor" /> Campaign Config
                </CardTitle>
                <Switch checked={formData.isActive} onCheckedChange={v => setFormData({...formData, isActive: v})} />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Heading</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Expiration Timer</Label>
                <div className="relative">
                  <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    type="datetime-local" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    className="h-12 pl-12 bg-gray-50 border-none rounded-xl font-bold" 
                  />
                </div>
                <p className="text-[9px] text-muted-foreground italic px-1">Sale will auto-deactivate after this timestamp.</p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Active Selection</span>
                  <Badge className="bg-amber-100 text-amber-700 border-none font-black">{formData.productIds.length} ITEMS</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.productIds.map(pid => {
                    const p = allProducts?.find(prod => prod.id === pid);
                    return (
                      <Badge key={pid} variant="secondary" className="bg-gray-100 text-[10px] font-bold py-1 pl-3 pr-1 gap-2 rounded-lg border-none">
                        <span className="truncate max-w-[100px]">{p?.name || pid}</span>
                        <button onClick={() => toggleProduct(pid)} className="p-0.5 hover:bg-gray-200 rounded-full text-red-500"><XCircle size={12}/></button>
                      </Badge>
                    );
                  })}
                  {formData.productIds.length === 0 && <p className="text-[10px] text-gray-400 italic">No products selected.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100 h-[700px] flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b p-6 space-y-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Product Picker</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Filter products..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-10 bg-white border-none rounded-xl text-xs"
                />
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts?.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                      formData.productIds.includes(product.id) ? "border-amber-500 bg-amber-50/50 shadow-inner" : "border-gray-50 bg-white hover:border-amber-200"
                    )}
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={20} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase truncate text-gray-900 leading-tight">{product.name}</p>
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">৳{product.price.toLocaleString()}</p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      formData.productIds.includes(product.id) ? "bg-amber-500 border-amber-500 text-white" : "border-gray-200"
                    )}>
                      {formData.productIds.includes(product.id) && <CheckCircle2 size={14} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

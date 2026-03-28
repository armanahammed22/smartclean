'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Search,
  Palette,
  Grid,
  Maximize,
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FlashSalesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const flashRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'flash_sale') : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(flashRef);

  const productsRef = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const { data: allProducts } = useCollection(productsRef);

  const [formData, setFormData] = useState<any>({
    title: 'Flash Sale',
    endDate: '',
    isActive: false,
    productIds: [],
    styleConfig: {
      bgColor: '#ffffff',
      titleColor: '#081621',
      cardType: 'premium',
      gridShow: '4',
      boxType: 'rounded-3xl',
      textSize: 'text-2xl'
    }
  });

  useEffect(() => {
    if (config) {
      setFormData({
        ...formData,
        ...config,
        styleConfig: { ...formData.styleConfig, ...(config.styleConfig || {}) }
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
      toast({ title: "Flash Sale Protocol Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProduct = (pid: string) => {
    const current = formData.productIds || [];
    setFormData({
      ...formData,
      productIds: current.includes(pid) 
        ? current.filter((id: string) => id !== pid) 
        : [...current, pid]
    });
  };

  const updateStyle = (key: string, val: string) => {
    setFormData({
      ...formData,
      styleConfig: { ...formData.styleConfig, [key]: val }
    });
  };

  if (configLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Flash Sale Campaign Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Full behavioral and visual control over active blitz offers</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase bg-amber-500 hover:bg-amber-600 text-black">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
          Publish Protocol
        </Button>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl">
          <TabsTrigger value="config" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase">
            <Timer size={14} /> Campaign Config
          </TabsTrigger>
          <TabsTrigger value="design" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase">
            <Palette size={14} /> Design & UI
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase">
            <Package size={14} /> Product Selection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#081621] text-white p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                    <Zap className="text-amber-400" size={24} fill="currentColor" /> Active Logic
                  </CardTitle>
                  <Switch checked={formData.isActive} onCheckedChange={v => setFormData({...formData, isActive: v})} />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">End Timestamp</Label>
                  <Input type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="design" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gray-50 border-b p-8">
                <CardTitle className="text-base font-black uppercase">UI Customization</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Background Color</Label>
                      <Input type="color" value={formData.styleConfig.bgColor} onChange={e => updateStyle('bgColor', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Title Color</Label>
                      <Input type="color" value={formData.styleConfig.titleColor} onChange={e => updateStyle('titleColor', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Card Type</Label>
                      <Select value={formData.styleConfig.cardType} onValueChange={v => updateStyle('cardType', v)}>
                        <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Grid</SelectItem>
                          <SelectItem value="premium">Premium Shadow</SelectItem>
                          <SelectItem value="minimal">Minimalist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Grid Columns (Desktop)</Label>
                      <Select value={formData.styleConfig.gridShow} onValueChange={v => updateStyle('gridShow', v)}>
                        <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                          <SelectItem value="5">5 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Box Radius</Label>
                      <Select value={formData.styleConfig.boxType} onValueChange={v => updateStyle('boxType', v)}>
                        <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rounded-none">Square</SelectItem>
                          <SelectItem value="rounded-2xl">Rounded LG</SelectItem>
                          <SelectItem value="rounded-3xl">Extra Rounded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100 h-[600px] flex flex-col">
            <CardHeader className="bg-gray-50/50 border-b p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Filter products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-10 pl-10 bg-white border-none rounded-xl" />
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allProducts?.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                  <div key={product.id} onClick={() => toggleProduct(product.id)} className={cn("p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group", formData.productIds?.includes(product.id) ? "border-amber-500 bg-amber-50/50" : "border-gray-50 bg-white hover:border-amber-200")}>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-gray-100 shrink-0">
                      {product.imageUrl && <Image src={product.imageUrl} alt="P" fill className="object-cover" unoptimized />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase truncate text-gray-900 leading-none">{product.name}</p>
                      <p className="text-[9px] font-bold text-amber-600 mt-1">৳{product.price}</p>
                    </div>
                    {formData.productIds?.includes(product.id) && <CheckCircle2 size={16} className="text-amber-500" />}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

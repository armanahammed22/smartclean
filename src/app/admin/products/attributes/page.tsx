
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Plus, 
  Trash2, 
  Layers, 
  ListChecks, 
  Settings2, 
  Loader2, 
  Save, 
  X,
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AttributesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const brandsQuery = useMemoFirebase(() => db ? query(collection(db, 'brands'), orderBy('name', 'asc')) : null, [db]);
  const variantsQuery = useMemoFirebase(() => db ? query(collection(db, 'variant_types'), orderBy('name', 'asc')) : null, [db]);
  const featuresQuery = useMemoFirebase(() => db ? query(collection(db, 'reusable_features'), orderBy('name', 'asc')) : null, [db]);
  const specsQuery = useMemoFirebase(() => db ? query(collection(db, 'reusable_specs'), orderBy('key', 'asc')) : null, [db]);

  const { data: brands, isLoading: brandsLoading } = useCollection(brandsQuery);
  const { data: variants, isLoading: variantsLoading } = useCollection(variantsQuery);
  const { data: features, isLoading: featuresLoading } = useCollection(featuresQuery);
  const { data: specs, isLoading: specsLoading } = useCollection(specsQuery);

  const handleDelete = async (col: string, id: string) => {
    if (!db || !confirm("Are you sure you want to delete this?")) return;
    await deleteDoc(doc(db, col, id));
    toast({ title: "Deleted Successfully" });
  };

  // --- Handlers ---
  const handleAddBrand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const name = new FormData(e.currentTarget).get('name') as string;
    if (!name) return;
    setIsSubmitting(true);
    await addDoc(collection(db, 'brands'), { name, status: 'Active', createdAt: new Date().toISOString() });
    e.currentTarget.reset();
    setIsSubmitting(false);
    toast({ title: "Brand Added" });
  };

  const handleAddVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const options = (formData.get('options') as string).split(',').map(o => o.trim()).filter(o => !!o);
    if (!name) return;
    setIsSubmitting(true);
    await addDoc(collection(db, 'variant_types'), { name, options, createdAt: new Date().toISOString() });
    e.currentTarget.reset();
    setIsSubmitting(false);
    toast({ title: "Variant Type Created" });
  };

  const handleAddFeature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const name = new FormData(e.currentTarget).get('name') as string;
    if (!name) return;
    setIsSubmitting(true);
    await addDoc(collection(db, 'reusable_features'), { name, createdAt: new Date().toISOString() });
    e.currentTarget.reset();
    setIsSubmitting(false);
    toast({ title: "Feature Template Added" });
  };

  const handleAddSpecKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const key = new FormData(e.currentTarget).get('key') as string;
    if (!key) return;
    setIsSubmitting(true);
    await addDoc(collection(db, 'reusable_specs'), { key, createdAt: new Date().toISOString() });
    e.currentTarget.reset();
    setIsSubmitting(false);
    toast({ title: "Specification Key Added" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attributes & Brands</h1>
        <p className="text-muted-foreground text-sm">Manage reusable properties for your product catalog</p>
      </div>

      <Tabs defaultValue="brands" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap shadow-sm">
          <TabsTrigger value="brands" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Award size={16} /> Brands
          </TabsTrigger>
          <TabsTrigger value="variants" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layers size={16} /> Variants
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ListChecks size={16} /> Key Features
          </TabsTrigger>
          <TabsTrigger value="specs" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings2 size={16} /> Specs
          </TabsTrigger>
        </TabsList>

        {/* Brands Tab */}
        <TabsContent value="brands" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold">Add Brand</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Brand Name</Label>
                    <Input name="name" placeholder="e.g. Samsung" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    <Plus size={16} /> Add Brand
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brandsLoading ? <Loader2 className="animate-spin" /> : brands?.map(b => (
                <Card key={b.id} className="border-none shadow-sm group bg-white rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-bold text-sm">{b.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete('brands', b.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold">New Variant Type</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddVariant} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Type Name</Label>
                    <Input name="name" placeholder="e.g. Color" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Options (Comma separated)</Label>
                    <Input name="options" placeholder="Red, Blue, Green" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    <Plus size={16} /> Create Variant
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {variantsLoading ? <Loader2 className="animate-spin" /> : variants?.map(v => (
                <Card key={v.id} className="border-none shadow-sm group bg-white rounded-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm uppercase tracking-tight">{v.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('variant_types', v.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {v.options?.map((opt: string) => (
                        <Badge key={opt} variant="secondary" className="text-[9px] font-bold uppercase">{opt}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold">Standard Feature</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddFeature} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Feature Text</Label>
                    <Input name="name" placeholder="e.g. 1 Year Warranty" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    <Plus size={16} /> Add Feature
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="md:col-span-2 space-y-2">
              {featuresLoading ? <Loader2 className="animate-spin" /> : features?.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-xs group">
                  <span className="text-sm font-medium">{f.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('reusable_features', f.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
              <CardHeader><CardTitle className="text-lg font-bold">Spec Key Template</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddSpecKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Key Name</Label>
                    <Input name="key" placeholder="e.g. Battery Capacity" required />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    <Plus size={16} /> Add Spec Key
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specsLoading ? <Loader2 className="animate-spin" /> : specs?.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-xs group border border-gray-50">
                  <span className="text-xs font-bold uppercase tracking-tight text-gray-600">{s.key}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete('reusable_specs', s.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Zap, 
  ListChecks, 
  Star, 
  Package, 
  ImageIcon, 
  Layout,
  CheckCircle2,
  Clock,
  Users,
  Settings2,
  Maximize,
  AlertTriangle,
  HelpCircle,
  Camera,
  Layers,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ServiceDetailedEditor() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Data References
  const serviceRef = useMemoFirebase(() => (db && id) ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: sLoading } = useDoc(serviceRef);

  const packagesQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'packages'), orderBy('price', 'asc')) : null, [db, id]);
  const addOnsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'addOns'), orderBy('name', 'asc')) : null, [db, id]);
  const includedQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'includedItems'), orderBy('title', 'asc')) : null, [db, id]);
  const reviewsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'reviews'), orderBy('createdAt', 'desc')) : null, [db, id]);

  const { data: packages } = useCollection(packagesQuery);
  const { data: addOns } = useCollection(addOnsQuery);
  const { data: includedItems } = useCollection(includedQuery);
  const { data: reviews } = useCollection(reviewsQuery);

  const [mainData, setMainData] = useState<any>({});

  useEffect(() => {
    if (service) {
      setMainData({
        ...service,
        faqList: service.faqList || [{ q: '', a: '' }],
        howToBook: service.howToBook || ['', '', '', ''],
        workProofImages: service.workProofImages || []
      });
    }
  }, [service]);

  const handleUpdateMain = async () => {
    if (!serviceRef) return;
    setIsSaving(true);
    try {
      await updateDoc(serviceRef, { ...mainData, updatedAt: new Date().toISOString() });
      toast({ title: "Service Identity Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSub = async (colName: string, data: any) => {
    if (!db || !id) return;
    try {
      await addDoc(collection(db, 'services', id as string, colName), data);
      toast({ title: "Entry Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add" });
    }
  };

  const handleDeleteSub = async (colName: string, subId: string) => {
    if (!db || !id || !confirm("Delete this item?")) return;
    try {
      await deleteDoc(doc(db, 'services', id as string, colName, subId));
      toast({ title: "Item Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  // UI Helpers for Dynamic Marketing Fields
  const updateFaq = (idx: number, field: 'q' | 'a', val: string) => {
    const list = [...mainData.faqList];
    list[idx][field] = val;
    setMainData({ ...mainData, faqList: list });
  };

  const updateHowTo = (idx: number, val: string) => {
    const list = [...mainData.howToBook];
    list[idx] = val;
    setMainData({ ...mainData, howToBook: list });
  };

  if (sLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Editor: {service?.title}</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Deep Content Customization</p>
        </div>
      </div>

      <Tabs defaultValue="identity" className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 w-full max-w-2xl rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="identity" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Layout size={14} /> Identity</TabsTrigger>
          <TabsTrigger value="packages" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Maximize size={14} /> Pricing Slabs</TabsTrigger>
          <TabsTrigger value="addons" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Zap size={14} /> Add-ons</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><HelpCircle size={14} /> Marketing & UI</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Star size={14} /> Reviews</TabsTrigger>
        </TabsList>

        {/* TAB: IDENTITY */}
        <TabsContent value="identity" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold flex items-center gap-2">Core Attributes</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Service Title</Label>
                    <Input value={mainData.title || ''} onChange={e => setMainData({...mainData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Pricing Logic</Label>
                    <Select value={mainData.pricingType || 'quantity'} onValueChange={v => setMainData({...mainData, pricingType: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="quantity">By Quantity (1, 2, 3...)</SelectItem>
                        <SelectItem value="sqft">By Area (Square Feet Slabs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Base Price (৳)</Label>
                    <Input type="number" value={mainData.basePrice || 0} onChange={e => setMainData({...mainData, basePrice: parseFloat(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Display Rating</Label>
                    <Input type="number" step="0.1" value={mainData.rating || 5.0} onChange={e => setMainData({...mainData, rating: parseFloat(e.target.value) || 5.0})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Rich Description</Label>
                  <Textarea value={mainData.description || ''} onChange={e => setMainData({...mainData, description: e.target.value})} className="min-h-[200px] bg-gray-50 border-none rounded-xl" />
                </div>
                <Button onClick={handleUpdateMain} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                  {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                  Save Identity Changes
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
              <ImageUploader label="Primary Listing Photo" initialUrl={mainData.imageUrl} onUpload={url => setMainData({...mainData, imageUrl: url})} aspectRatio="aspect-[4/3]" />
            </Card>
          </div>
        </TabsContent>

        {/* TAB: MARKETING & UI */}
        <TabsContent value="marketing" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-[#081621] text-white p-8 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-xl text-white"><HelpCircle size={24} /></div>
                    <div>
                      <CardTitle className="text-lg font-black uppercase">FAQ / How To Book</CardTitle>
                      <CardDescription className="text-white/40 text-[9px] font-bold uppercase">Toggle and configure instructional content</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                    <Label className="text-[10px] font-black text-white uppercase">Mode</Label>
                    <div className="flex bg-black/20 p-1 rounded-lg">
                      <button type="button" onClick={() => setMainData({...mainData, showFaq: true})} className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all", mainData.showFaq ? "bg-white text-primary" : "text-white/40")}>FAQ</button>
                      <button type="button" onClick={() => setMainData({...formData, showFaq: false})} className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase transition-all", !mainData.showFaq ? "bg-white text-primary" : "text-white/40")}>STEPS</button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {mainData.showFaq ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      {mainData.faqList?.map((faq: any, i: number) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative group">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Question {i+1}</Label>
                            <Input value={faq.q} onChange={e => updateFaq(i, 'q', e.target.value)} className="bg-white border-none h-10 font-bold text-xs" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Answer</Label>
                            <Textarea value={faq.a} onChange={e => updateFaq(i, 'a', e.target.value)} className="bg-white border-none min-h-[80px] text-xs" />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => {
                            const list = mainData.faqList.filter((_: any, idx: number) => idx !== i);
                            setMainData({ ...mainData, faqList: list });
                          }} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></Button>
                        </div>
                      ))}
                      <Button onClick={() => setMainData({...mainData, faqList: [...(mainData.faqList || []), { q: '', a: '' }]})} variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 uppercase font-black text-[10px]">+ Add FAQ Entry</Button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      {mainData.howToBook?.map((step: string, i: number) => (
                        <div key={i} className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">{i+1}</div>
                          <Input value={step} onChange={e => updateHowTo(i, e.target.value)} placeholder={`Step ${i+1} details...`} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-indigo-600 text-white p-8">
                  <div className="flex items-center gap-3">
                    <Camera size={24} />
                    <CardTitle className="text-lg font-black uppercase tracking-widest">Work Proof Gallery</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {mainData.workProofImages?.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden group">
                        <Image src={img} alt="Proof" fill className="object-cover" unoptimized />
                        <button onClick={() => {
                          const list = mainData.workProofImages.filter((_: any, idx: number) => idx !== i);
                          setMainData({ ...mainData, workProofImages: list });
                        }} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                      </div>
                    ))}
                    <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                      <ImageUploader label="Add Photo" initialUrl="" onUpload={url => setMainData({...mainData, workProofImages: [...(mainData.workProofImages || []), url]})} aspectRatio="aspect-video" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleUpdateMain} disabled={isSaving} className="w-full h-16 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 bg-[#081621] hover:bg-black">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 size={20} className="mr-2" />}
                Publish Marketing Updates
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB: PRICING SLABS (PACKAGES) */}
        <TabsContent value="packages" className="space-y-6">
          <div className="flex flex-col gap-2 px-4 mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-tighter">Pricing Tiers / Area Slabs</h2>
              <Button onClick={() => handleAddSub('packages', { name: 'New Slab', price: 1000, isRecommended: false })} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
                <Plus size={14} /> Add New Slab
              </Button>
            </div>
            {mainData.pricingType !== 'sqft' && (
              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Warning: Logic is set to "Quantity". These slabs may not show as primary selectors.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages?.map((pkg) => (
              <Card key={pkg.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group">
                <CardHeader className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
                  <Badge className={cn("text-[8px] font-black uppercase", pkg.isRecommended ? "bg-primary text-white" : "bg-gray-200 text-gray-500")}>
                    {pkg.isRecommended ? 'Recommended' : 'Standard'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSub('packages', pkg.id)} className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-40">Label (e.g. 1000-1200 Sqft)</Label>
                    <Input defaultValue={pkg.name} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'packages', pkg.id), { name: e.target.value })} className="h-9 bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-40">Tier Price (৳)</Label>
                    <Input type="number" defaultValue={pkg.price ?? 0} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'packages', pkg.id), { price: parseFloat(e.target.value) || 0 })} className="h-11 bg-primary/5 border-none font-black text-primary text-lg" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] font-black uppercase">Most Recommended</span>
                    <Switch checked={pkg.isRecommended} onCheckedChange={val => updateDoc(doc(db!, 'services', id as string, 'packages', pkg.id), { isRecommended: val })} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: ADD-ONS */}
        <TabsContent value="addons" className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-lg font-black uppercase tracking-tighter">Optional Add-ons</h2>
            <Button onClick={() => handleAddSub('addOns', { name: 'Extra Item', price: 500 })} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
              <Plus size={14} /> Add Task
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns?.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white rounded-2xl group border border-gray-100">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Zap size={16} /></div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSub('addOns', item.id)}><Trash2 size={12} /></Button>
                  </div>
                  <Input defaultValue={item.name} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'addOns', item.id), { name: e.target.value })} className="h-8 border-none font-bold text-xs p-0" />
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-black text-emerald-600">+৳</span>
                    <Input type="number" defaultValue={item.price ?? 0} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'addOns', item.id), { price: parseFloat(e.target.value) || 0 })} className="h-6 border-none font-black text-sm bg-transparent p-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: REVIEWS */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-lg font-black uppercase tracking-tighter">Client Reviews</h2>
            <Button onClick={() => handleAddSub('reviews', { name: 'Happy Client', rating: 5, text: 'Amazing service!', createdAt: new Date().toISOString() })} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
              <Plus size={14} /> Add Review
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {reviews?.map((review) => (
              <Card key={review.id} className="border-none shadow-sm bg-white rounded-2xl group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-primary">{review.name?.[0]}</div>
                      <div>
                        <Input defaultValue={review.name} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'reviews', review.id), { name: e.target.value })} className="h-6 border-none font-bold text-sm p-0" />
                        <div className="flex gap-1 mt-1">
                          {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= review.rating ? "currentColor" : "none"} className={i > 4 ? "opacity-30" : ""} />)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteSub('reviews', review.id)}><Trash2 size={14} /></Button>
                  </div>
                  <Textarea defaultValue={review.text} onBlur={e => updateDoc(doc(db!, 'services', id as string, 'reviews', review.id), { text: e.target.value })} className="bg-gray-50 border-none text-xs leading-relaxed" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

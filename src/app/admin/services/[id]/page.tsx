"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, addDoc, deleteDoc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
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
  Star, 
  ImageIcon, 
  Layout,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Settings2,
  Maximize,
  HelpCircle,
  Camera,
  Layers,
  X,
  ListChecks,
  ShieldCheck,
  Package,
  MoreVertical,
  Video,
  Info,
  DollarSign,
  Briefcase,
  Wrench
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function UnifiedServiceEditor() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const isNew = id === 'new';

  // 1. Core Service Data
  const serviceRef = useMemoFirebase(() => (db && !isNew) ? doc(db, 'services', id as string) : null, [db, id, isNew]);
  const { data: service, isLoading: sLoading } = useDoc(serviceRef);

  // 2. Auxiliary Data
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const reviewsQuery = useMemoFirebase(() => (db && !isNew) ? query(collection(db, 'services', id as string, 'reviews'), orderBy('createdAt', 'desc')) : null, [db, id]);
  const { data: reviews } = useCollection(reviewsQuery);

  // Unified State
  const [formData, setFormData] = useState<any>({
    title: '',
    categoryId: '',
    description: '',
    duration: '',
    teamSize: '',
    rating: 5.0,
    imageUrl: '',
    galleryImages: [],
    videoUrl: '',
    basePrice: '',
    regularPrice: '',
    extraCharges: 0,
    pricingType: 'fixed',
    sqftOptions: [],
    included: [],
    notIncluded: [],
    checklist: [],
    features: [],
    highlights: [],
    status: 'Active',
    isPopular: false,
    isBookingEnabled: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        ...formData,
        ...service,
        basePrice: service.basePrice?.toString() || '',
        regularPrice: service.regularPrice?.toString() || '',
        included: service.included || [],
        notIncluded: service.notIncluded || [],
        checklist: service.checklist || [],
        features: service.features || [],
        highlights: service.highlights || [],
        galleryImages: service.galleryImages || []
      });
    }
  }, [service]);

  const handleSave = async () => {
    if (!db) return;
    if (!formData.title) {
      toast({ variant: "destructive", title: "Missing Information", description: "Service title is required." });
      return;
    }

    setIsSaving(true);
    const slug = formData.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const payload = {
      ...formData,
      slug,
      basePrice: parseFloat(formData.basePrice) || 0,
      regularPrice: parseFloat(formData.regularPrice) || 0,
      extraCharges: parseFloat(formData.extraCharges) || 0,
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        const newRef = doc(collection(db, 'services'));
        await setDoc(newRef, { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Service Created Successfully" });
        router.push('/admin/services');
      } else {
        await updateDoc(serviceRef!, payload);
        toast({ title: "Service Configuration Published" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (key: string, value: any = '') => setFormData({ ...formData, [key]: [...(formData[key] || []), value] });
  const updateArrayItem = (key: string, idx: number, value: any) => {
    const list = [...formData[key]];
    list[idx] = value;
    setFormData({ ...formData, [key]: list });
  };
  const removeArrayItem = (key: string, idx: number) => setFormData({ ...formData, [key]: formData[key].filter((_: any, i: number) => i !== idx) });

  async function handleDeleteReview(reviewId: string) {
    if (!confirm("Remove feedback?")) return;
    await deleteDoc(doc(db!, 'services', id as string, 'reviews', reviewId));
    toast({ title: "Feedback Removed" });
  }

  if (!isNew && sLoading) return <div className="p-32 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-xs font-black uppercase tracking-widest text-gray-400">Booting Unified Editor...</p></div>;

  return (
    <div className="space-y-8 pb-32 max-w-6xl mx-auto min-w-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 scale-150"><Wrench size={120} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-2xl bg-gray-50 hover:bg-gray-100 h-12 w-12 border">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
              {isNew ? 'Define New Logic' : formData.title}
            </h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
               <ShieldCheck size={12} className="text-primary"/> Operational Service Terminal
            </p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
          <Button onClick={handleSave} disabled={isSaving} className="h-12 px-10 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 gap-3 bg-primary hover:bg-primary/90 transition-all">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            {isNew ? 'Create Service' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="basic" className="space-y-8">
        <TabsList className="bg-white border p-1 h-14 w-full rounded-2xl overflow-x-auto no-scrollbar shadow-sm">
          <TabsTrigger value="basic" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Layout size={14}/> Basic Info</TabsTrigger>
          <TabsTrigger value="media" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Camera size={14}/> Media Hub</TabsTrigger>
          <TabsTrigger value="pricing" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><DollarSign size={14}/> Pricing & Add-ons</TabsTrigger>
          <TabsTrigger value="checklists" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><ListChecks size={14}/> Checklists</TabsTrigger>
          <TabsTrigger value="features" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Zap size={14}/> Features</TabsTrigger>
          {!isNew && <TabsTrigger value="reviews" className="flex-1 rounded-xl gap-2 font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white transition-all"><Star size={14}/> Feedback</TabsTrigger>}
        </TabsList>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* SECTION 1: BASIC INFO */}
          <TabsContent value="basic" className="mt-0">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
              <CardHeader className="p-8 border-b bg-gray-50/50">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><Layout size={18} className="text-primary"/> Service Identity</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Full Name</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Corporate Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Market Category</Label>
                    <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {categories?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold py-3 uppercase text-[10px]">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Operation Duration</Label>
                    <Input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="e.g. 2-4 Hours" className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Required Personnel</Label>
                    <Input value={formData.teamSize} onChange={e => setFormData({...formData, teamSize: e.target.value})} placeholder="e.g. 3 Experts" className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Detailed Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[200px] bg-gray-50 border-none rounded-[2rem] p-8 leading-loose focus:bg-white transition-all shadow-inner" placeholder="Explain the service scope in detail..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 2: MEDIA HUB */}
          <TabsContent value="media" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                <ImageUploader label="Primary Listing Asset" hint="800 x 600 px (4:3 Ratio)" initialUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} aspectRatio="aspect-[4/3]" />
              </Card>
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Gallery Logic</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Optional extra images</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {formData.galleryImages?.map((img: string, i: number) => (
                    <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border">
                      <Image src={img} alt="Gallery" fill className="object-cover" />
                      <button onClick={() => removeArrayItem('galleryImages', i)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    </div>
                  ))}
                  <div className="flex items-center justify-center border-2 border-dashed rounded-2xl aspect-square hover:bg-gray-50 transition-colors">
                    <ImageUploader initialUrl="" onUpload={url => addArrayItem('galleryImages', url)} label="" aspectRatio="aspect-square" className="border-none" />
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Promotional Video URL (YouTube)</Label>
                  <div className="relative">
                    <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/..." className="h-12 pl-12 bg-gray-50 border-none rounded-xl font-mono text-xs" />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* SECTION 3: PRICING & ADD-ONS */}
          <TabsContent value="pricing" className="mt-0">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
              <CardHeader className="p-8 border-b bg-gray-50/50">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><DollarSign size={20} className="text-primary"/> Billing Configuration</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sale Price (৳)</Label>
                        <Input type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary text-lg" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Regular Price (৳)</Label>
                        <Input type="number" value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-gray-400 line-through" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Operational Extra Charge (৳)</Label>
                      <Input type="number" value={formData.extraCharges} onChange={e => setFormData({...formData, extraCharges: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-6 bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Maximize size={14}/> Pricing Logic</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {['fixed', 'sqft', 'quantity'].map(type => (
                        <button key={type} type="button" onClick={() => setFormData({...formData, pricingType: type})} className={cn("py-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all", formData.pricingType === type ? "bg-white border-primary text-primary shadow-md scale-105" : "bg-transparent border-transparent text-gray-400 hover:text-gray-600")}>
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 bg-white rounded-2xl text-[10px] font-medium text-gray-500 leading-relaxed italic border border-gray-100">
                      <Info size={12} className="inline mr-1 mb-1 text-primary"/> Pricing logic defines how the total amount is calculated at checkout. "Sqft" allows for custom area slabs.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 4: CHECKLISTS */}
          <TabsContent value="checklists" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Included */}
              <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><CheckCircle2 size={16}/> Included</h3>
                  <Button variant="ghost" size="icon" onClick={() => addArrayItem('included')} className="rounded-xl bg-emerald-50 text-emerald-600"><Plus size={16}/></Button>
                </div>
                <div className="space-y-2">
                  {formData.included?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={item} onChange={e => updateArrayItem('included', i, e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                      <button onClick={() => removeArrayItem('included', i)} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Not Included */}
              <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2"><XCircle size={16}/> Not Included</h3>
                  <Button variant="ghost" size="icon" onClick={() => addArrayItem('notIncluded')} className="rounded-xl bg-rose-50 text-rose-600"><Plus size={16}/></Button>
                </div>
                <div className="space-y-2">
                  {formData.notIncluded?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={item} onChange={e => updateArrayItem('notIncluded', i, e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                      <button onClick={() => removeArrayItem('notIncluded', i)} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Step Checklist */}
              <Card className="border-none shadow-sm rounded-3xl bg-[#081621] text-white p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><ListChecks size={16}/> Step Logic</h3>
                  <Button variant="ghost" size="icon" onClick={() => addArrayItem('checklist')} className="rounded-xl bg-white/10 text-white"><Plus size={16}/></Button>
                </div>
                <div className="space-y-2">
                  {formData.checklist?.map((item: string, i: number) => (
                    <div key={i} className="flex gap-2 group animate-in slide-in-from-left-2">
                      <Input value={item} onChange={e => updateArrayItem('checklist', i, e.target.value)} className="h-10 bg-white/10 border-none rounded-xl text-xs font-bold text-white placeholder:text-white/20" placeholder={`Step ${i+1}`} />
                      <button onClick={() => removeArrayItem('checklist', i)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* SECTION 5: FEATURES & HIGHLIGHTS */}
          <TabsContent value="features" className="mt-0 space-y-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><Zap size={20} className="text-primary"/> Highlight Matrix</CardTitle>
                  <Button onClick={() => addArrayItem('features', { icon: 'Zap', title: 'Feature', desc: '' })} className="rounded-xl h-10 px-6 font-black uppercase text-[10px]">+ Add Highlight</Button>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.features?.map((f: any, i: number) => (
                      <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="flex gap-4">
                          <div className="space-y-2 flex-1">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Icon Key</Label>
                            <Input value={f.icon} onChange={e => updateArrayItem('features', i, { ...f, icon: e.target.value })} className="h-9 bg-white border-none rounded-lg text-[10px] font-black uppercase" />
                          </div>
                          <div className="space-y-2 flex-[2]">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Title</Label>
                            <Input value={f.title} onChange={e => updateArrayItem('features', i, { ...f, title: e.target.value })} className="h-9 bg-white border-none rounded-lg font-bold" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                          <Input value={f.desc} onChange={e => updateArrayItem('features', i, { ...f, desc: e.target.value })} className="h-9 bg-white border-none rounded-lg text-xs" />
                        </div>
                        <button onClick={() => removeArrayItem('features', i)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-2"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* SECTION 6: REVIEWS */}
          <TabsContent value="reviews" className="mt-0">
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                   <CardTitle className="text-lg font-black uppercase">Moderation Queue</CardTitle>
                   <CardDescription>Approve or purge customer testimonials for this service</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-gray-100/50">
                        <TableRow className="border-none">
                          <TableHead className="pl-8 py-5">Customer</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead className="text-right pr-8">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews?.map(rev => (
                          <TableRow key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="pl-8 py-5">
                              <div className="font-bold text-sm uppercase">{rev.userName}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex text-amber-400"><Star size={12} fill="currentColor" className="mr-1" /> {rev.rating}</div>
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate text-xs text-gray-600">"{rev.text}"</TableCell>
                            <TableCell className="text-right pr-8">
                               <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 bg-emerald-50 rounded-lg"><CheckCircle2 size={16}/></Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 bg-rose-50 rounded-lg" onClick={() => handleDeleteReview(rev.id)}><Trash2 size={16}/></Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!reviews || reviews.length === 0) && (
                          <TableRow><TableCell colSpan={4} className="text-center py-20 italic text-muted-foreground">Queue clear. No pending reviews.</TableCell></TableRow>
                        )}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

        </div>
      </Tabs>

      {/* Global Status Footer */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-fit max-w-[90vw]">
         <div className="bg-[#081621] text-white p-4 px-8 rounded-full shadow-2xl border border-white/10 flex items-center gap-10 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center gap-4 border-r border-white/10 pr-10">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-primary tracking-widest">Public Visibility</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Switch checked={formData.status === 'Active'} onCheckedChange={v => setFormData({...formData, status: v ? 'Active' : 'Inactive'})} />
                    <span className="text-[10px] font-bold">{formData.status}</span>
                  </div>
               </div>
               <div className="flex flex-col ml-4">
                  <span className="text-[8px] font-black uppercase text-primary tracking-widest">Pricing</span>
                  <span className="text-xs font-black mt-0.5">৳{formData.basePrice || 0}</span>
               </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="h-11 px-10 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/40 gap-3">
               {isSaving ? <Loader2 className="animate-spin h-3 w-3" /> : <Save size={16}/>} Sync & Publish
            </Button>
         </div>
      </div>
    </div>
  );
}
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  MoreVertical
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

  const serviceRef = useMemoFirebase(() => (db && id) ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: sLoading } = useDoc(serviceRef);

  const reviewsQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'services', id as string, 'reviews'), orderBy('createdAt', 'desc')) : null, [db, id]);
  const { data: reviews } = useCollection(reviewsQuery);

  const [mainData, setMainData] = useState<any>({});

  useEffect(() => {
    if (service) {
      setMainData({
        ...service,
        pricingType: service.pricingType || 'fixed',
        sqftOptions: service.sqftOptions || [],
        included: service.included || [],
        notIncluded: service.notIncluded || [],
        features: service.features || [],
        beforeAfterImages: service.beforeAfterImages || [],
        isBookingEnabled: service.isBookingEnabled ?? true,
        bookingButtonText: service.bookingButtonText || 'Book Now',
        reviewsEnabled: service.reviewsEnabled ?? true
      });
    }
  }, [service]);

  const handleUpdateMain = async () => {
    if (!serviceRef) return;
    setIsSaving(true);
    try {
      await updateDoc(serviceRef, { ...mainData, updatedAt: new Date().toISOString() });
      toast({ title: "Service Config Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleReview = async (reviewId: string, current: string) => {
    if (!db || !id) return;
    const newStatus = current === 'Approved' ? 'Pending' : 'Approved';
    await updateDoc(doc(db, 'services', id as string, 'reviews', reviewId), { status: newStatus });
    toast({ title: "Review Visibility Updated" });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!db || !id || !confirm("Delete this review permanently?")) return;
    await deleteDoc(doc(db, 'services', id as string, 'reviews', reviewId));
    toast({ title: "Review Purged" });
  };

  if (sLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/services')} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{mainData.title || 'Service Config'}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Intelligent Service Terminal</p>
          </div>
        </div>
        <Button onClick={handleUpdateMain} disabled={isSaving} className="h-12 px-8 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Sync & Publish
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 w-full max-w-4xl rounded-xl overflow-x-auto no-scrollbar">
          <TabsTrigger value="basic" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Layout size={14} /> Basic Info</TabsTrigger>
          <TabsTrigger value="media" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Camera size={14} /> Media</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Maximize size={14} /> Pricing</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><ListChecks size={14} /> Checklists</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Zap size={14} /> Features</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg gap-2 flex-1 font-bold text-[10px] uppercase"><Star size={14} /> Reviews</TabsTrigger>
        </TabsList>

        {/* BASIC INFO */}
        <TabsContent value="basic" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 border-b p-8">
                <CardTitle className="text-lg font-bold">Identity & Controls</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Service Title</Label>
                    <Input value={mainData.title || ''} onChange={e => setMainData({...mainData, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Working Duration</Label>
                    <Input value={mainData.duration || ''} onChange={e => setMainData({...mainData, duration: e.target.value})} placeholder="e.g. 2-3 hrs" className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">No. of Staff</Label>
                    <Input value={mainData.teamSize || ''} onChange={e => setMainData({...mainData, teamSize: e.target.value})} placeholder="e.g. 2 Persons" className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Manual Rating Override</Label>
                    <Input type="number" step="0.1" value={mainData.rating || 5.0} onChange={e => setMainData({...mainData, rating: parseFloat(e.target.value) || 5.0})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Description (Paragraph)</Label>
                  <Textarea value={mainData.description || ''} onChange={e => setMainData({...mainData, description: e.target.value})} className="min-h-[150px] bg-gray-50 border-none rounded-xl p-6 leading-loose" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl bg-[#081621] text-white p-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2"><Zap size={16} /> Booking Logic</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase">Enable Booking</Label>
                    <p className="text-[9px] text-white/40 uppercase">ALLOW CUSTOMERS TO BOOK</p>
                  </div>
                  <Switch checked={mainData.isBookingEnabled} onCheckedChange={v => setMainData({...mainData, isBookingEnabled: v})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40">Button Text</Label>
                  <Input value={mainData.bookingButtonText} onChange={e => setMainData({...mainData, bookingButtonText: e.target.value})} className="h-11 bg-white/10 border-none rounded-xl font-black uppercase tracking-tighter" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* MEDIA */}
        <TabsContent value="media" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <ImageUploader label="Primary Listing Image" initialUrl={mainData.imageUrl} onUpload={url => setMainData({...mainData, imageUrl: url})} aspectRatio="aspect-[4/3]" />
            </Card>
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Before / After Gallery</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Tag your work proof images</p>
                </div>
                <Button onClick={() => setMainData({...mainData, beforeAfterImages: [...mainData.beforeAfterImages, { url: '', tag: 'Before' }]})} variant="outline" size="sm" className="rounded-xl"><Plus size={16}/></Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mainData.beforeAfterImages?.map((img: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl space-y-3 relative group">
                    <ImageUploader initialUrl={img.url} onUpload={url => {
                      const list = [...mainData.beforeAfterImages];
                      list[i].url = url;
                      setMainData({...mainData, beforeAfterImages: list});
                    }} aspectRatio="aspect-video" />
                    <div className="flex gap-2">
                      {['Before', 'After'].map(tag => (
                        <button key={tag} type="button" onClick={() => {
                          const list = [...mainData.beforeAfterImages];
                          list[i].tag = tag;
                          setMainData({...mainData, beforeAfterImages: list});
                        }} className={cn("flex-1 h-8 rounded-lg text-[9px] font-black uppercase transition-all", img.tag === tag ? "bg-primary text-white" : "bg-white text-gray-400 border")}>{tag}</button>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const list = mainData.beforeAfterImages.filter((_:any, idx: number) => idx !== i);
                      setMainData({...mainData, beforeAfterImages: list});
                    }} className="absolute -top-2 -right-2 bg-red-100 text-red-600 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* PRICING */}
        <TabsContent value="pricing" className="max-w-4xl mx-auto space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50 p-8 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2"><Maximize size={20} className="text-primary"/> Pricing Logic</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'fixed', label: 'Fixed Price', desc: 'One-time cost' },
                  { id: 'sqft', label: 'Sqft Based', desc: 'Area slab pricing' },
                  { id: 'quantity', label: 'Quantity Based', desc: 'Base price x Qty' }
                ].map(opt => (
                  <button key={opt.id} type="button" onClick={() => setMainData({...mainData, pricingType: opt.id})} className={cn("p-6 rounded-2xl border-2 transition-all text-center space-y-1", mainData.pricingType === opt.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-50 bg-white hover:border-gray-200")}>
                    <p className="font-black uppercase text-xs">{opt.label}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {mainData.pricingType === 'sqft' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-black uppercase text-primary">Square Feet Options</Label>
                    <Button type="button" size="sm" onClick={() => setMainData({...mainData, sqftOptions: [...mainData.sqftOptions, { label: '', price: 0 }]})} className="rounded-xl h-8 text-[10px] uppercase font-black">+ Add Slab</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {mainData.sqftOptions.map((opt: any, i: number) => (
                      <div key={i} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 items-center">
                        <Input placeholder="e.g. 500-1000 Sqft" value={opt.label} onChange={e => {
                          const list = [...mainData.sqftOptions];
                          list[i].label = e.target.value;
                          setMainData({...mainData, sqftOptions: list});
                        }} className="flex-1 bg-white" />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-primary">৳</span>
                          <Input type="number" placeholder="Price" value={opt.price} onChange={e => {
                            const list = [...mainData.sqftOptions];
                            list[i].price = parseFloat(e.target.value) || 0;
                            setMainData({...mainData, sqftOptions: list});
                          }} className="pl-7 bg-white font-black" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const list = mainData.sqftOptions.filter((_:any, idx: number) => idx !== i);
                          setMainData({...mainData, sqftOptions: list});
                        }} className="text-destructive"><X size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center animate-in zoom-in-95">
                  <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                    <div className="space-y-2 flex-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Standard Base Price (৳)</Label>
                      <Input type="number" value={mainData.basePrice || 0} onChange={e => setMainData({...mainData, basePrice: parseFloat(e.target.value) || 0})} className="h-14 bg-white text-2xl font-black text-primary text-center rounded-2xl border-none shadow-xl" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT (INCLUDED / NOT INCLUDED) */}
        <TabsContent value="content" className="max-w-4xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase tracking-widest text-green-600 flex items-center gap-2"><CheckCircle2 size={18}/> Included</h3>
                <Button variant="ghost" size="icon" onClick={() => setMainData({...mainData, included: [...mainData.included, '']})} className="text-primary hover:bg-primary/5 rounded-lg"><Plus size={18}/></Button>
              </div>
              <div className="space-y-3">
                {mainData.included?.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input value={item} onChange={e => {
                      const list = [...mainData.included];
                      list[i] = e.target.value;
                      setMainData({...mainData, included: list});
                    }} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                    <button type="button" onClick={() => {
                      const list = mainData.included.filter((_:any, idx: number) => idx !== i);
                      setMainData({...mainData, included: list});
                    }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase tracking-widest text-red-600 flex items-center gap-2"><XCircle size={18}/> Not Included</h3>
                <Button variant="ghost" size="icon" onClick={() => setMainData({...mainData, notIncluded: [...mainData.notIncluded, '']})} className="text-primary hover:bg-primary/5 rounded-lg"><Plus size={18}/></Button>
              </div>
              <div className="space-y-3">
                {mainData.notIncluded?.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <Input value={item} onChange={e => {
                      const list = [...mainData.notIncluded];
                      list[i] = e.target.value;
                      setMainData({...mainData, notIncluded: list});
                    }} className="h-10 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                    <button type="button" onClick={() => {
                      const list = mainData.notIncluded.filter((_:any, idx: number) => idx !== i);
                      setMainData({...mainData, notIncluded: list});
                    }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* FEATURES (WHY CHOOSE US) */}
        <TabsContent value="marketing" className="max-w-4xl mx-auto space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-primary">Why Choose Us Cards</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Unique feature highlights for this service</p>
              </div>
              <Button onClick={() => setMainData({...mainData, features: [...mainData.features, { icon: 'Zap', title: 'Feature', desc: 'Short description' }]})} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest">+ New Card</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mainData.features?.map((f: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4 relative group">
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Icon Keyword</Label>
                      <Input value={f.icon} onChange={e => {
                        const list = [...mainData.features];
                        list[i].icon = e.target.value;
                        setMainData({...mainData, features: list});
                      }} className="h-9 bg-white border-none text-[10px] font-black uppercase" />
                    </div>
                    <div className="space-y-2 flex-[2]">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Title</Label>
                      <Input value={f.title} onChange={e => {
                        const list = [...mainData.features];
                        list[i].title = e.target.value;
                        setMainData({...mainData, features: list});
                      }} className="h-9 bg-white border-none font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Summary</Label>
                    <Input value={f.desc} onChange={e => {
                      const list = [...mainData.features];
                      list[i].desc = e.target.value;
                      setMainData({...mainData, features: list});
                    }} className="h-9 bg-white border-none text-xs" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                    const list = mainData.features.filter((_:any, idx: number) => idx !== i);
                    setMainData({...mainData, features: list});
                  }} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* REVIEWS */}
        <TabsContent value="reviews" className="space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase">Review Moderation</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Approve or Purge customer feedback</CardDescription>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border">
                <Label className="text-[10px] font-black uppercase">Service Reviews</Label>
                <Switch checked={mainData.reviewsEnabled} onCheckedChange={v => setMainData({...mainData, reviewsEnabled: v})} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow>
                    <TableHead className="font-bold pl-8">Customer</TableHead>
                    <TableHead className="font-bold">Rating</TableHead>
                    <TableHead className="font-bold">Comment</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right pr-8">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews?.map((rev) => (
                    <TableRow key={rev.id} className="hover:bg-gray-50/50">
                      <TableCell className="pl-8 py-5">
                        <div className="font-bold text-sm uppercase leading-tight">{rev.userName}</div>
                        <div className="text-[9px] text-muted-foreground font-mono mt-1">{new Date(rev.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex text-amber-400 gap-0.5">
                          {[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 font-medium max-w-[300px] truncate">{rev.text}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase border-none",
                          rev.status === 'Approved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {rev.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleToggleReview(rev.id, rev.status)}>{rev.status === 'Approved' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>}</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteReview(rev.id)}><Trash2 size={16}/></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!reviews || reviews.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No customer feedback yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

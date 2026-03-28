"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Save, 
  Layers, 
  Users, 
  Clock, 
  CheckCircle2, 
  Image as ImageIcon, 
  X, 
  Settings2, 
  XCircle, 
  Eye, 
  Star,
  ListChecks,
  Zap,
  Layout,
  Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [newServiceData, setNewServiceData] = useState({
    title: '',
    basePrice: '',
    duration: '',
    teamSize: '',
    categoryId: 'Cleaning',
    badgeText: '',
    description: '',
    status: 'Active',
    isPopular: false,
    rating: 5.0
  });

  const [newPackages, setNewPackages] = useState<any[]>([]);
  const [newAddOns, setNewAddOns] = useState<any[]>([]);
  const [newScope, setNewScope] = useState<any[]>([]);

  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
  const subServicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'sub_services')) : null, [db, user]);
  
  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: subServices } = useCollection(subServicesQuery);

  const stats = useMemo(() => {
    if (!services) return { total: 0, subTotal: 0, active: 0, inactive: 0 };
    return {
      total: services.length,
      subTotal: subServices?.length || 0,
      active: services.filter(s => s.status === 'Active').length,
      inactive: services.filter(s => s.status === 'Inactive').length
    };
  }, [services, subServices]);

  const toggleSelectAll = () => {
    if (selectedIds.length === services?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(services?.map(s => s.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} services?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'services', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Delete Completed" });
    } catch (e) {} finally {
      setIsBulkProcessing(false);
    }
  };

  const resetForm = () => {
    setNewServiceData({
      title: '',
      basePrice: '',
      duration: '',
      teamSize: '',
      categoryId: 'Cleaning',
      badgeText: '',
      description: '',
      status: 'Active',
      isPopular: false,
      rating: 5.0
    });
    setMainImageUrl('');
    setNewPackages([]);
    setNewAddOns([]);
    setNewScope([]);
  };

  const handleSaveFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    try {
      const serviceDoc = {
        ...newServiceData,
        basePrice: parseFloat(newServiceData.basePrice as string) || 0,
        imageUrl: mainImageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'services'), serviceDoc);
      const serviceId = docRef.id;

      const batch = writeBatch(db);
      newPackages.forEach(pkg => {
        const pRef = doc(collection(db, 'services', serviceId, 'packages'));
        batch.set(pRef, { ...pkg, createdAt: new Date().toISOString() });
      });
      newAddOns.forEach(addon => {
        const aRef = doc(collection(db, 'services', serviceId, 'addOns'));
        batch.set(aRef, { ...addon, createdAt: new Date().toISOString() });
      });
      newScope.forEach(item => {
        const sRef = doc(collection(db, 'services', serviceId, 'includedItems'));
        batch.set(sRef, { ...item, createdAt: new Date().toISOString() });
      });
      await batch.commit();

      toast({ title: "Service Created" });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Service Catalog</h1>
          <p className="text-muted-foreground text-sm">Professional service definitions and pricing</p>
        </div>
        <Button className="w-full md:w-auto gap-2 font-black shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus size={18} /> Add New Service
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active Services", val: stats.total, icon: Wrench, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Sub-Categories", val: stats.subTotal, icon: Layers, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Published", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Offline", val: stats.inactive, icon: XCircle, bg: "bg-amber-50", color: "text-amber-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-black uppercase">{selectedIds.length} SERVICES SELECTED</span>
          </div>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-white hover:bg-red-500 font-black uppercase text-[10px] h-8">
            <Trash2 size={14} className="mr-2" /> Bulk Delete
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={services?.length ? selectedIds.length === services.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Service Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Starts From</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Performance</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                ) : services?.map((service) => (
                  <TableRow key={service.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(service.id) && "bg-primary/5")}>
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                      />
                    </TableCell>
                    <TableCell className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{service.title}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase">{service.categoryId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] font-black uppercase border-none px-2 py-0.5", service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-xs">
                        <Star size={12} fill="currentColor" /> {service.rating?.toFixed(1) || '5.0'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setViewingService(service)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl gap-2 font-black text-[9px] uppercase border-primary/20 text-primary" asChild>
                          <Link href={`/admin/services/${service.id}`}><Settings2 size={14} /> Edit</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'services', service.id))}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] rounded-t-[2rem] md:rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="flex flex-col h-[85vh]">
            <header className="p-6 bg-[#081621] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl"><Wrench size={24} /></div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">নতুন সার্ভিস যুক্ত করুন</DialogTitle>
              </div>
              <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Title</Label>
                    <Input 
                      value={newServiceData.title} 
                      onChange={e => setNewServiceData({...newServiceData, title: e.target.value})} 
                      required 
                      className="h-12 bg-gray-50 border-none rounded-xl font-bold" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Base Price (৳)</Label>
                      <Input 
                        type="number" 
                        value={newServiceData.basePrice} 
                        onChange={e => setNewServiceData({...newServiceData, basePrice: e.target.value})} 
                        required 
                        className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                      <Select value={newServiceData.categoryId} onValueChange={v => setNewServiceData({...newServiceData, categoryId: v})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {['Cleaning', 'Maintenance', 'Repair'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                    <Textarea 
                      value={newServiceData.description} 
                      onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} 
                      className="bg-gray-50 border-none rounded-2xl min-h-[150px] p-6 leading-relaxed" 
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <ImageUploader 
                    label="Service Thumbnail" 
                    hint="800 x 600 px"
                    initialUrl={mainImageUrl} 
                    onUpload={setMainImageUrl} 
                    aspectRatio="aspect-[4/3]"
                  />
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">Most Popular</Label>
                      <p className="text-[9px] text-muted-foreground">SHOW BADGE ON HOMEPAGE</p>
                    </div>
                    <Switch checked={newServiceData.isPopular} onCheckedChange={val => setNewServiceData({...newServiceData, isPopular: val})} />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border w-full sm:w-auto justify-between">
                <Label className="text-[10px] font-black uppercase">Publish Immediately</Label>
                <Switch defaultChecked={true} onCheckedChange={v => setNewServiceData({...newServiceData, status: v ? 'Active' : 'Inactive'})} />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-[10px] tracking-widest px-8">Discard</Button>
                <Button onClick={handleSaveFull} disabled={isSubmitting} className="flex-1 sm:flex-none rounded-xl font-black px-12 h-12 bg-primary shadow-xl uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Create Service</>}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingService} onOpenChange={() => setViewingService(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="p-8 bg-[#081621] text-white flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">{viewingService?.title}</DialogTitle>
            <button onClick={() => setViewingService(null)} className="text-white/60 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-gray-50 border">
              {viewingService?.imageUrl ? (
                <Image src={viewingService.imageUrl} alt="Preview" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><Wrench size={80} /></div>
              )}
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Base Rate</p>
                <span className="text-3xl font-black text-primary">৳{viewingService?.basePrice?.toLocaleString()}</span>
                <div className="flex gap-4 mt-2">
                  <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5 uppercase"><Clock size={12} className="text-primary" /> {viewingService?.duration || 'Flexible'}</p>
                  <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5 uppercase"><Users size={12} className="text-blue-500" /> {viewingService?.teamSize || 'Professional'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">"{viewingService?.description || 'Full service details available in deep configuration mode.'}"</p>
              <div className="pt-4 border-t flex gap-3">
                <Button className="flex-1 font-black uppercase text-xs h-11" asChild>
                  <Link href={`/admin/services/${viewingService?.id}`}>Configure</Link>
                </Button>
                <Button variant="outline" className="flex-1 font-black uppercase text-xs h-11" onClick={() => setViewingService(null)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

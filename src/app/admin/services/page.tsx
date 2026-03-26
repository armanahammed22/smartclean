
"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Detailed Form State
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

  // Data Queries
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
      // 1. Add Main Service
      const serviceDoc = {
        ...newServiceData,
        basePrice: parseFloat(newServiceData.basePrice as string) || 0,
        imageUrl: mainImageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'services'), serviceDoc);
      const serviceId = docRef.id;

      // 2. Add Sub-collections (Packages, Addons, Scope)
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

      toast({ title: "Service Created", description: "All details, packages, and scope items were saved." });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (!confirm(`Permanently remove ${selectedIds.length} services?`)) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'services', id));
      });
      await batch.commit();
      toast({ title: "Bulk Delete Completed", description: "All selected services removed." });
      setSelectedIds([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Bulk Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this service? This will delete all sub-data as well.")) return;
    await deleteDoc(doc(db, 'services', id));
    toast({ title: "Service Removed" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Service Catalog</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage professional offerings and pricing tiers</p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2 font-black uppercase text-[10px]">
              <Trash2 size={14} /> Remove ({selectedIds.length})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto gap-2 font-bold shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90">
                <Plus size={18} /> Add New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] rounded-t-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <form onSubmit={handleSaveFull} className="flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Wrench className="text-primary" /> Create Full Service Profile
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="identity" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="bg-gray-50 border-b p-1 h-12 w-full justify-start rounded-none px-8 overflow-x-auto no-scrollbar">
                    <TabsTrigger value="identity" className="rounded-lg gap-2 font-black uppercase text-[10px]"><Layout size={14} /> Identity</TabsTrigger>
                    <TabsTrigger value="packages" className="rounded-lg gap-2 font-black uppercase text-[10px]"><Package size={14} /> Packages</TabsTrigger>
                    <TabsTrigger value="addons" className="rounded-lg gap-2 font-black uppercase text-[10px]"><Zap size={14} /> Add-ons</TabsTrigger>
                    <TabsTrigger value="scope" className="rounded-lg gap-2 font-black uppercase text-[10px]"><ListChecks size={14} /> Scope</TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white custom-scrollbar">
                    {/* TAB: IDENTITY */}
                    <TabsContent value="identity" className="mt-0 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <ImageUploader onUpload={setMainImageUrl} initialUrl={mainImageUrl} label="Primary Photo" aspectRatio="aspect-video" />
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                            <Input value={newServiceData.title} onChange={e => setNewServiceData({...newServiceData, title: e.target.value})} required placeholder="e.g. Sofa Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Starts From (৳)</Label>
                              <Input value={newServiceData.basePrice} onChange={e => setNewServiceData({...newServiceData, basePrice: e.target.value})} type="number" required placeholder="5000" className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration</Label>
                              <Input value={newServiceData.duration} onChange={e => setNewServiceData({...newServiceData, duration: e.target.value})} placeholder="e.g. 2-4 Hours" className="h-12 bg-gray-50 border-none rounded-xl" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Category</Label>
                              <Select value={newServiceData.categoryId} onValueChange={v => setNewServiceData({...newServiceData, categoryId: v})}>
                                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                                  <SelectItem value="Repair">Repair</SelectItem>
                                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Badge Text (Optional)</Label>
                              <Input value={newServiceData.badgeText} onChange={e => setNewServiceData({...newServiceData, badgeText: e.target.value})} placeholder="e.g. NEW" className="h-12 bg-gray-50 border-none rounded-xl font-black uppercase text-primary" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-black uppercase">Highlight</Label>
                              <p className="text-[9px] font-bold text-primary opacity-60">SHOW ON HOMEPAGE POPULAR</p>
                            </div>
                            <Switch checked={newServiceData.isPopular} onCheckedChange={v => setNewServiceData({...newServiceData, isPopular: v})} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</Label>
                        <Textarea value={newServiceData.description} onChange={e => setNewServiceData({...newServiceData, description: e.target.value})} className="bg-gray-50 border-none rounded-2xl min-h-[120px] p-4" placeholder="Describe the service process..." />
                      </div>
                    </TabsContent>

                    {/* TAB: PACKAGES */}
                    <TabsContent value="packages" className="mt-0 space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <h3 className="text-sm font-black uppercase tracking-tighter">Pricing Tiers</h3>
                        <Button type="button" onClick={() => setNewPackages([...newPackages, { id: Math.random(), name: '', areaSize: '', price: 0, isRecommended: false }])} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
                          <Plus size={14} /> Add Tier
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newPackages.map((pkg, idx) => (
                          <div key={pkg.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                            <button type="button" onClick={() => setNewPackages(newPackages.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-destructive p-1 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                            <div className="space-y-4">
                              <Input placeholder="Package Name (e.g. 2 Bedroom)" value={pkg.name} onChange={e => {
                                const list = [...newPackages];
                                list[idx].name = e.target.value;
                                setNewPackages(list);
                              }} className="bg-white border-none font-bold" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Size (e.g. 1000sqft)" value={pkg.areaSize} onChange={e => {
                                  const list = [...newPackages];
                                  list[idx].areaSize = e.target.value;
                                  setNewPackages(list);
                                }} className="bg-white border-none text-xs" />
                                <Input type="number" placeholder="Price (৳)" value={pkg.price} onChange={e => {
                                  const list = [...newPackages];
                                  list[idx].price = parseFloat(e.target.value) || 0;
                                  setNewPackages(list);
                                }} className="bg-white border-none text-xs font-black text-primary" />
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-[10px] font-bold uppercase text-gray-400">Featured Tier</span>
                                <Switch checked={pkg.isRecommended} onCheckedChange={v => {
                                  const list = [...newPackages];
                                  list[idx].isRecommended = v;
                                  setNewPackages(list);
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {newPackages.length === 0 && <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground uppercase font-black text-[10px]">No packages added</div>}
                      </div>
                    </TabsContent>

                    {/* TAB: ADDONS */}
                    <TabsContent value="addons" className="mt-0 space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <h3 className="text-sm font-black uppercase tracking-tighter">Optional Tasks</h3>
                        <Button type="button" onClick={() => setNewAddOns([...newAddOns, { id: Math.random(), name: '', price: 0 }])} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
                          <Plus size={14} /> Add Add-on
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {newAddOns.map((addon, idx) => (
                          <div key={addon.id} className="p-4 bg-white rounded-xl border border-gray-100 flex flex-col gap-3 relative shadow-sm">
                            <button type="button" onClick={() => setNewAddOns(newAddOns.filter((_, i) => i !== idx))} className="absolute top-1 right-1 text-destructive p-1"><X size={14}/></button>
                            <Input placeholder="Addon Name" value={addon.name} onChange={e => {
                              const list = [...newAddOns];
                              list[idx].name = e.target.value;
                              setNewAddOns(list);
                            }} className="h-8 text-xs font-bold" />
                            <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg">
                              <span className="text-[10px] font-black opacity-30">৳</span>
                              <Input type="number" placeholder="Price" value={addon.price} onChange={e => {
                                const list = [...newAddOns];
                                list[idx].price = parseFloat(e.target.value) || 0;
                                setNewAddOns(list);
                              }} className="h-6 border-none bg-transparent text-xs font-black p-0" />
                            </div>
                          </div>
                        ))}
                        {newAddOns.length === 0 && <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground uppercase font-black text-[10px]">No add-ons added</div>}
                      </div>
                    </TabsContent>

                    {/* TAB: SCOPE */}
                    <TabsContent value="scope" className="mt-0 space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <h3 className="text-sm font-black uppercase tracking-tighter">Included Checklist</h3>
                        <Button type="button" onClick={() => setNewScope([...newScope, { id: Math.random(), title: '' }])} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px]">
                          <Plus size={14} /> Add Scope Item
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {newScope.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-white border rounded-xl group">
                            <CheckCircle2 size={16} className="text-accent shrink-0" />
                            <Input placeholder="Describe what's included..." value={item.title} onChange={e => {
                              const list = [...newScope];
                              list[idx].title = e.target.value;
                              setNewScope(list);
                            }} className="h-8 border-none text-xs p-0 flex-1" />
                            <button type="button" onClick={() => setNewScope(newScope.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-destructive"><X size={14}/></button>
                          </div>
                        ))}
                        {newScope.length === 0 && <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground uppercase font-black text-[10px]">List is empty</div>}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>

                <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex-col sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-12 h-14 bg-primary hover:bg-primary/90 shadow-xl uppercase tracking-tighter w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2" /> Deploy All Details</>}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Services", val: stats.total, icon: Wrench, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Active Tasks", val: stats.subTotal, icon: Layers, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Published", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Hidden", val: stats.inactive, icon: XCircle, bg: "bg-amber-50", color: "text-amber-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={services?.length > 0 && selectedIds.length === services?.length} 
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5">Service Details</TableHead>
                  <TableHead className="font-bold">Starts From</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Performance</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
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
                    <TableCell className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{service.title}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{service.categoryId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] font-black uppercase border-none px-2 py-0.5", service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                        <Star size={12} fill="currentColor" /> {service.rating?.toFixed(1) || '5.0'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => setViewingService(service)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl gap-2 font-black text-[9px] uppercase border-primary/20 text-primary hover:bg-primary/5" asChild>
                          <Link href={`/admin/services/${service.id}`}><Settings2 size={14} /> Edit</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(service.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* QUICK VIEW DIALOG */}
      <Dialog open={!!viewingService} onOpenChange={() => setViewingService(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">{viewingService?.title}</DialogTitle>
            <Badge className="bg-primary text-white border-none">{viewingService?.status}</Badge>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-gray-50 border">
              {viewingService?.imageUrl ? (
                <Image src={viewingService.imageUrl} alt="Preview" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><Wrench size={80} /></div>
              )}
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Overview</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-gray-400">Starting from</span>
                  <span className="text-3xl font-black text-primary">৳{viewingService?.basePrice?.toLocaleString()}</span>
                </div>
                <div className="flex gap-4 mt-2">
                  <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {viewingService?.duration || 'Flexible'}</p>
                  <p className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5"><Users size={12} className="text-blue-500" /> {viewingService?.teamSize || 'Professional'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Short Description</p>
                <p className="text-xs text-gray-600 leading-relaxed italic">"{viewingService?.shortDescription || 'No quick summary provided.'}"</p>
              </div>
              <div className="pt-4 border-t flex gap-3">
                <Button className="flex-1 font-bold h-11" asChild>
                  <Link href={`/admin/services/${viewingService?.id}`}>Deep Configuration</Link>
                </Button>
                <Button variant="outline" className="flex-1 font-bold h-11" onClick={() => setViewingService(null)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

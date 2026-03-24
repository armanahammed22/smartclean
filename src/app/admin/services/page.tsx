"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Trash2, Edit, Loader2, Save, Layers, Users, Clock, CheckCircle2, Image as ImageIcon, X, Settings2, XCircle, Eye, Star } from 'lucide-react';
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

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [mainImageUrl, setMainImageUrl] = useState('');

  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
  const subServicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'sub_services')) : null, [db, user]);
  
  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: subServices } = useCollection(subServicesQuery);

  // Calculate KPI Stats
  const stats = useMemo(() => {
    if (!services) return { total: 0, subTotal: 0, active: 0, inactive: 0 };
    return {
      total: services.length,
      subTotal: subServices?.length || 0,
      active: services.filter(s => s.status === 'Active').length,
      inactive: services.filter(s => s.status === 'Inactive').length
    };
  }, [services, subServices]);

  // Selection Handlers
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const serviceData = {
      title: formData.get('title') as string,
      basePrice: parseFloat(formData.get('basePrice') as string),
      duration: formData.get('duration') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string || 'Active',
      categoryId: formData.get('categoryId') as string || 'Cleaning',
      imageUrl: mainImageUrl,
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'services'), { ...serviceData, createdAt: new Date().toISOString(), rating: 5.0 });
      toast({ title: "Service Published", description: "Listing is now live." });
      setIsDialogOpen(false);
      setMainImageUrl('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save the service." });
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto gap-2 font-bold shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90">
                <Plus size={18} /> Add New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[95vw] rounded-t-[2rem] md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <form onSubmit={handleSave} className="flex flex-col">
                <DialogHeader className="p-6 md:p-8 bg-[#081621] text-white">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Deploy Base Service</DialogTitle>
                </DialogHeader>
                <div className="p-6 md:p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <ImageUploader onUpload={setMainImageUrl} initialUrl={mainImageUrl} label="Primary Thumbnail" aspectRatio="aspect-video" />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                    <Input name="title" required placeholder="e.g. Expert Sofa Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Base Price (৳)</Label>
                      <Input name="basePrice" type="number" required placeholder="5000" className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duration</Label>
                      <Input name="duration" placeholder="e.g. 2-4 Hours" className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Type</Label>
                    <Select name="categoryId" defaultValue="Cleaning">
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t flex-col sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Now"}
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

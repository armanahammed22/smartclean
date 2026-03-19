"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Trash2, Edit, Loader2, Save, Layers, Users, Clock, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
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

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image States
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Data Queries (Auth Guarded to prevent transient permission errors)
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'service_categories')) : null, [db, user]);
  const subServicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'sub_services')) : null, [db, user]);
  const employeesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles')) : null, [db, user]);

  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: subServices } = useCollection(subServicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  const KPI_STATS = [
    { label: "Total Services", value: services?.length || 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Sub-Services", value: subServices?.length || 0, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Services", value: services?.filter(s => s.status === 'Active').length || 0, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Staff", value: employees?.length || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

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
      shortDescription: formData.get('shortDescription') as string,
      status: formData.get('status') as string || 'Active',
      categoryId: formData.get('categoryId') as string || 'general',
      imageUrl: mainImageUrl,
      galleryImages: galleryImages,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), serviceData);
        toast({ title: "Service Updated", description: "All changes saved successfully." });
      } else {
        await addDoc(collection(db, 'services'), { ...serviceData, createdAt: new Date().toISOString() });
        toast({ title: "Service Added", description: "New offering is now live." });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save the service." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setMainImageUrl('');
    setGalleryImages([]);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this service? This action cannot be undone.")) return;
    await deleteDoc(doc(db, 'services', id));
    toast({ title: "Service Removed" });
  };

  const handleOpenEdit = (service: any) => {
    setEditingService(service);
    setMainImageUrl(service.imageUrl || '');
    setGalleryImages(service.galleryImages || []);
    setIsDialogOpen(true);
  };

  const addToGallery = (url: string) => {
    if (url && !galleryImages.includes(url)) {
      setGalleryImages([...galleryImages, url]);
    }
  };

  const removeFromGallery = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Operations</h1>
          <p className="text-muted-foreground text-sm">Manage core cleaning services and pricing models</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <form onSubmit={handleSave} className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg"><Wrench size={24} className="text-primary" /></div>
                  {editingService ? 'Modify Service Package' : 'Publish New Service'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* LEFT COLUMN: IMAGES */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ImageIcon size={14} /> Main Listing Photo
                      </Label>
                      <ImageUploader 
                        initialUrl={mainImageUrl}
                        aspectRatio="aspect-[4/3]"
                        onUpload={setMainImageUrl}
                        label=""
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Gallery</Label>
                        <Badge variant="outline" className="text-[9px] font-bold opacity-60 uppercase">{galleryImages.length} Photos</Badge>
                      </div>
                      
                      {/* Gallery Preview Carousel */}
                      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar min-h-[100px] items-center">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 shrink-0 group">
                            <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeFromGallery(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50 shrink-0">
                          <ImageIcon size={24} className="text-gray-300" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground italic">Add more images by URL to the gallery:</p>
                        <div className="flex gap-2">
                          <Input 
                            id="gallery-url-input"
                            placeholder="Paste image URL here..." 
                            className="h-10 bg-gray-50 border-gray-100 text-xs" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  addToGallery(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="h-10 px-4 font-bold"
                            onClick={() => {
                              const input = document.getElementById('gallery-url-input') as HTMLInputElement;
                              if (input.value) {
                                addToGallery(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: FIELDS */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Package Name</Label>
                        <Input 
                          ref={nameInputRef}
                          name="title" 
                          defaultValue={editingService?.title} 
                          required 
                          placeholder="e.g. Premium Home Deep Cleaning" 
                          className="h-12 bg-gray-50 border-none focus:bg-white text-base font-medium rounded-xl" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Starting Price (BDT)</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">৳</span>
                          <Input 
                            name="basePrice" 
                            type="number" 
                            defaultValue={editingService?.basePrice} 
                            required 
                            className="h-12 pl-10 bg-gray-50 border-none focus:bg-white font-black rounded-xl" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Est. Duration</Label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <Input 
                            name="duration" 
                            defaultValue={editingService?.duration} 
                            placeholder="e.g. 4-6 Hours" 
                            className="h-12 pl-11 bg-gray-50 border-none focus:bg-white rounded-xl" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Industry Category</Label>
                        <Select name="categoryId" defaultValue={editingService?.categoryId || "Cleaning"}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Repair">Repair</SelectItem>
                            <SelectItem value="Expert">Expert Solution</SelectItem>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visibility Status</Label>
                        <Select name="status" defaultValue={editingService?.status || "Active"}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Active">Active & Public</SelectItem>
                            <SelectItem value="Inactive">Hidden / Internal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Short Description (Summary)</Label>
                      <Input 
                        name="shortDescription" 
                        defaultValue={editingService?.shortDescription} 
                        placeholder="A brief 1-line summary for listing cards..." 
                        className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Service Scope</Label>
                      <Textarea 
                        name="description" 
                        defaultValue={editingService?.description} 
                        className="bg-gray-50 border-none focus:bg-white min-h-[150px] rounded-2xl p-4 leading-relaxed" 
                        placeholder="What exactly is included in this service? Be detailed to build customer trust..." 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-gray-50/50 border-t shrink-0 flex items-center justify-end gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-gray-500 h-12 px-8">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-12 h-12 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 uppercase tracking-tight gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingService ? 'Update Service' : 'Publish Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {KPI_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Service Details</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Starting From</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Syncing services...</TableCell></TableRow>
              ) : services?.length ? (
                services.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                          {service.imageUrl ? (
                            <Image src={service.imageUrl} alt={service.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/40"><Wrench size={20} /></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-tight uppercase text-sm">{service.title}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                            <Clock size={10} className="text-primary" /> {service.duration || 'Variable'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase border-gray-200 text-gray-500 bg-gray-50/50">{service.categoryId || 'General'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none uppercase px-2.5 py-1 rounded-full",
                        service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleOpenEdit(service)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-xl" onClick={() => handleDelete(service.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No services configured yet. Start by adding your first offering.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench, Clock, DollarSign, Trash2, Edit, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('title', 'asc'));
  }, [db]);

  const { data: services, isLoading } = useCollection(servicesQuery);

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
      imageUrl: formData.get('imageUrl') as string,
      status: 'Active',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingService) {
        updateDoc(doc(db, 'services', editingService.id), serviceData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `services/${editingService.id}`, operation: 'update', requestResourceData: serviceData }));
        });
        toast({ title: "Service Updated" });
      } else {
        addDoc(collection(db, 'services'), { ...serviceData, createdAt: new Date().toISOString() }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'services', operation: 'create', requestResourceData: serviceData }));
        });
        toast({ title: "Service Added" });
      }
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error saving service" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'services', id)).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `services/${id}`, operation: 'delete' }));
    });
    toast({ title: "Service Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-muted-foreground text-sm">Configure your service offerings and pricing</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingService(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingService(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Title</Label>
                    <Input name="title" defaultValue={editingService?.title} required placeholder="e.g. Deep Home Cleaning" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Price (BDT)</Label>
                      <Input name="basePrice" type="number" defaultValue={editingService?.basePrice} required placeholder="2000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input name="duration" defaultValue={editingService?.duration} required placeholder="2 hrs" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <ImageUploader 
                    label="Service Preview Image"
                    initialUrl={editingService?.imageUrl}
                    onUpload={(url) => {
                      const input = document.getElementById('service-image-url') as HTMLInputElement;
                      if(input) input.value = url;
                    }}
                  />
                  <input type="hidden" name="imageUrl" id="service-image-url" defaultValue={editingService?.imageUrl} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Service Description</Label>
                <Textarea name="description" defaultValue={editingService?.description} className="min-h-[100px]" placeholder="Explain what is included in this service..." />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  {editingService ? 'Update Service' : 'Save Service'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full py-24 text-center flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-muted-foreground font-medium">Loading catalog...</span>
          </div>
        ) : services?.length ? (
          services.map((service) => (
            <Card key={service.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white">
              <CardHeader className="pb-3 bg-gray-50/50">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-white border rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <Wrench size={20} />
                  </div>
                  <Badge className="text-[9px] font-black border-none bg-green-100 text-green-700">{service.status?.toUpperCase() || 'ACTIVE'}</Badge>
                </div>
                <CardTitle className="mt-4 text-base font-bold text-gray-900 line-clamp-1">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Price From</span>
                    <span className="text-base font-black text-primary">৳{service.basePrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-muted-foreground">Duration</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
                      <Clock size={10} /> {service.duration || '2 hrs'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-[10px] font-bold" onClick={() => { setEditingService(service); setIsDialogOpen(true); }}>
                    <Edit size={12} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-lg shrink-0" onClick={() => handleDelete(service.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
            <Wrench size={40} className="mx-auto mb-4 opacity-10" />
            No services configured yet.
          </div>
        )}
      </div>
    </div>
  );
}

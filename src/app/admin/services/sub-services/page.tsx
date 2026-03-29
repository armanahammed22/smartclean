
"use client";

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Trash2, Edit, Loader2, Save, X, AlertTriangle, Zap, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function SubServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [formValues, setFormValues] = useState({
    name: '',
    mainServiceId: '',
    price: '',
    duration: '',
    description: '',
    status: 'Active',
    isAddOnEnabled: true,
    isDefaultAddOn: false,
    pricingType: 'quantity' as 'quantity' | 'sqft'
  });

  // Data Queries
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

  const { data: subServices, isLoading } = useCollection(subServicesQuery);
  const { data: services } = useCollection(servicesQuery);

  useEffect(() => {
    if (editingSub) {
      setFormValues({
        name: editingSub.name || '',
        mainServiceId: editingSub.mainServiceId || '',
        price: editingSub.price?.toString() || '',
        duration: editingSub.duration || '',
        description: editingSub.description || '',
        status: editingSub.status || 'Active',
        isAddOnEnabled: editingSub.isAddOnEnabled ?? true,
        isDefaultAddOn: editingSub.isDefaultAddOn ?? false,
        pricingType: editingSub.pricingType || 'quantity'
      });
      setImageUrl(editingSub.imageUrl || '');
    } else {
      setFormValues({
        name: '',
        mainServiceId: '',
        price: '',
        duration: '',
        description: '',
        status: 'Active',
        isAddOnEnabled: true,
        isDefaultAddOn: false,
        pricingType: 'quantity'
      });
      setImageUrl('');
    }
  }, [editingSub]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formValues.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Sub-service name is required." });
      return;
    }
    if (!formValues.mainServiceId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a parent service." });
      return;
    }

    setIsSubmitting(true);

    const subData = {
      name: formValues.name.trim(),
      mainServiceId: formValues.mainServiceId,
      price: parseFloat(formValues.price) || 0,
      duration: formValues.duration.trim(),
      description: formValues.description.trim(),
      status: formValues.status,
      isAddOnEnabled: formValues.isAddOnEnabled,
      isDefaultAddOn: formValues.isDefaultAddOn,
      pricingType: formValues.pricingType,
      imageUrl: imageUrl,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingSub) {
        await updateDoc(doc(db, 'sub_services', editingSub.id), subData);
        toast({ title: "Updated Successfully" });
      } else {
        await addDoc(collection(db, 'sub_services'), { 
          ...subData, 
          createdAt: serverTimestamp() 
        });
        toast({ title: "Created Successfully" });
      }
      setIsDialogOpen(false);
      setEditingSub(null);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: editingSub ? `sub_services/${editingSub.id}` : 'sub_services',
        operation: editingSub ? 'update' : 'create',
        requestResourceData: subData
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (sub: any) => {
    setEditingSub(sub);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this sub-service permanently?")) return;
    try {
      await deleteDoc(doc(db, 'sub_services', id));
      toast({ title: "Removed Successfully" });
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `sub_services/${id}`,
        operation: 'delete'
      }));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Sub-Services Desk</h1>
          <p className="text-muted-foreground text-sm">Configure task-based services and add-on pricing</p>
        </div>
        <Button className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary hover:bg-primary/90" onClick={() => { setEditingSub(null); setIsDialogOpen(true); }}>
          <Plus size={18} /> Add New Sub-Service
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingSub(null); }}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 bg-[#081621] text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {editingSub ? 'Edit Sub-Service' : 'Create Sub-Service'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Name</Label>
                    <Input value={formValues.name} onChange={e => setFormValues({...formValues, name: e.target.value})} placeholder="e.g. Sofa Shampoo" className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Parent Service</Label>
                    <Select value={formValues.mainServiceId} onValueChange={val => setFormValues({...formValues, mainServiceId: val})}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Parent" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Price (৳)</Label>
                      <Input type="number" value={formValues.price} onChange={e => setFormValues({...formValues, price: e.target.value})} className="h-11 bg-gray-50 border-none font-black rounded-xl text-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pricing Logic</Label>
                      <Select value={formValues.pricingType} onValueChange={v => setFormValues({...formValues, pricingType: v as any})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="quantity">By Quantity</SelectItem>
                          <SelectItem value="sqft">By Square Feet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <ImageUploader label="Icon" initialUrl={imageUrl} onUpload={setImageUrl} aspectRatio="aspect-square" />
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <Label className="text-[10px] font-black uppercase text-blue-900">Add-on Mode</Label>
                      <Switch checked={formValues.isAddOnEnabled} onCheckedChange={val => setFormValues({...formValues, isAddOnEnabled: val})} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                <Textarea value={formValues.description} onChange={e => setFormValues({...formValues, description: e.target.value})} className="bg-gray-50 border-none min-h-[100px] rounded-xl p-4 font-medium" />
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl bg-primary text-white">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Sync Service</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Sub-Service</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Pricing Type</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Base Price</TableHead>
                  <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Mode</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : subServices?.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {sub.imageUrl && <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate leading-tight">{sub.name}</div>
                          <p className="text-[9px] text-primary font-bold uppercase mt-0.5">{services?.find(s => s.id === sub.mainServiceId)?.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase">
                        {sub.pricingType === 'sqft' ? 'Square Feet' : 'Quantity'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-sm text-gray-900">৳{sub.price?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", sub.isAddOnEnabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400")}>
                        {sub.isAddOnEnabled ? 'ADD-ON' : 'STANDALONE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => openEdit(sub)}><Edit size={16} /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(sub.id)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

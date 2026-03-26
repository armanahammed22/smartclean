
"use client";

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Trash2, Edit, Loader2, Save, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';

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
    isDefaultAddOn: false
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
        isDefaultAddOn: editingSub.isDefaultAddOn ?? false
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
        isDefaultAddOn: false
      });
      setImageUrl('');
    }
  }, [editingSub]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    // Validation
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
      imageUrl: imageUrl,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingSub) {
        await updateDoc(doc(db, 'sub_services', editingSub.id), subData);
        toast({ title: "Updated Successfully", description: `${subData.name} has been updated.` });
      } else {
        await addDoc(collection(db, 'sub_services'), { 
          ...subData, 
          createdAt: new Date().toISOString() 
        });
        toast({ title: "Created Successfully", description: `${subData.name} has been added to the catalog.` });
      }
      setIsDialogOpen(false);
      setEditingSub(null);
    } catch (error: any) {
      console.error("Firestore Save Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Save Failed", 
        description: error.message || "An unexpected error occurred while saving. Check your permissions."
      });
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
      toast({ variant: "destructive", title: "Delete Failed", description: e.message });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Services Management</h1>
          <p className="text-muted-foreground text-sm">Configure child services and upselling add-ons</p>
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
                {editingSub ? 'Edit Sub-Service' : 'Create Sub-Service Definition'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub-Service Name</Label>
                    <Input 
                      value={formValues.name} 
                      onChange={e => setFormValues({...formValues, name: e.target.value})} 
                      required 
                      placeholder="e.g. Sofa Shampoo Wash" 
                      className="h-11 bg-gray-50 border-none rounded-xl font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Parent Service</Label>
                    <Select 
                      value={formValues.mainServiceId} 
                      onValueChange={val => setFormValues({...formValues, mainServiceId: val})}
                    >
                      <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold">
                        <SelectValue placeholder="Select Parent" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price (৳)</Label>
                      <Input 
                        type="number" 
                        value={formValues.price} 
                        onChange={e => setFormValues({...formValues, price: e.target.value})} 
                        required 
                        className="h-11 bg-gray-50 border-none font-black rounded-xl text-primary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Duration</Label>
                      <Input 
                        value={formValues.duration} 
                        onChange={e => setFormValues({...formValues, duration: e.target.value})} 
                        placeholder="1 hr" 
                        className="h-11 bg-gray-50 border-none rounded-xl font-bold" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <ImageUploader label="Icon / Thumbnail" initialUrl={imageUrl} onUpload={setImageUrl} aspectRatio="aspect-square" />
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <Label className="text-[10px] font-black uppercase text-blue-900">Enable as Add-on</Label>
                      <Switch 
                        checked={formValues.isAddOnEnabled} 
                        onCheckedChange={val => setFormValues({...formValues, isAddOnEnabled: val})} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100">
                      <Label className="text-[10px] font-black uppercase text-green-900">Default Selected</Label>
                      <Switch 
                        checked={formValues.isDefaultAddOn} 
                        onCheckedChange={val => setFormValues({...formValues, isDefaultAddOn: val})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  value={formValues.description} 
                  onChange={e => setFormValues({...formValues, description: e.target.value})} 
                  className="bg-gray-50 border-none min-h-[100px] rounded-xl p-4 font-medium" 
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-gray-50 border-t">
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
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Main Category</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Base Price</TableHead>
                  <TableHead className="font-bold text-center uppercase text-[10px] tracking-widest">Add-on Mode</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : subServices?.length ? (
                  subServices.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 shadow-inner">
                            {sub.imageUrl && <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" unoptimized />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[250px] leading-tight">{sub.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {sub.id.slice(0, 6)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px] tracking-widest">
                          {services?.find(s => s.id === sub.mainServiceId)?.title || 'Independent'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-sm text-gray-900">৳{sub.price?.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {sub.isAddOnEnabled ? (
                          <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black uppercase px-2 py-0.5">ENABLED</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-400 border-none text-[8px] font-black uppercase px-2 py-0.5">DISABLED</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => openEdit(sub)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(sub.id)}><Trash2 size={16} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 text-muted-foreground italic font-medium">No sub-services configured yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

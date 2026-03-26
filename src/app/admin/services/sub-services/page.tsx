
"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Trash2, Edit, Loader2, Save, Wrench, Clock, CheckCircle2, XCircle, Zap, Star } from 'lucide-react';
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

export default function SubServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Data Queries
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

  const { data: subServices, isLoading } = useCollection(subServicesQuery);
  const { data: services } = useCollection(servicesQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const subData = {
      name: formData.get('name') as string,
      mainServiceId: formData.get('mainServiceId') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      duration: formData.get('duration') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string || 'Active',
      isAddOnEnabled: formData.get('isAddOnEnabled') === 'on',
      isDefaultAddOn: formData.get('isDefaultAddOn') === 'on',
      imageUrl: imageUrl || editingSub?.imageUrl || '',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingSub) {
        await updateDoc(doc(db, 'sub_services', editingSub.id), subData);
        toast({ title: "Sub-Service Updated" });
      } else {
        await addDoc(collection(db, 'sub_services'), { ...subData, createdAt: new Date().toISOString() });
        toast({ title: "Sub-Service Added" });
      }
      setIsDialogOpen(false);
      setEditingSub(null);
      setImageUrl('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save task." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (sub: any) => {
    setEditingSub(sub);
    setImageUrl(sub.imageUrl || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this sub-service?")) return;
    await deleteDoc(doc(db, 'sub_services', id));
    toast({ title: "Removed Successfully" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Services Management</h1>
          <p className="text-muted-foreground text-sm">Configure child services and upselling add-ons</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingSub(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingSub(null); setImageUrl(''); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Sub-Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 bg-[#081621] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingSub ? 'Edit Sub-Service' : 'Create Sub-Service Definition'}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sub-Service Name</Label>
                      <Input name="name" defaultValue={editingSub?.name} required placeholder="e.g. Sofa Shampoo Wash" className="h-11 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Parent Service</Label>
                      <Select name="mainServiceId" defaultValue={editingSub?.mainServiceId || ""}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue placeholder="Select Parent" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price (৳)</Label>
                        <Input name="price" type="number" defaultValue={editingSub?.price} required className="h-11 bg-gray-50 border-none font-black" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Duration</Label>
                        <Input name="duration" defaultValue={editingSub?.duration} placeholder="1 hr" className="h-11 bg-gray-50 border-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <ImageUploader label="Icon / Thumbnail" initialUrl={imageUrl} onUpload={setImageUrl} aspectRatio="aspect-square" />
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <Label className="text-[10px] font-black uppercase">Enable as Add-on</Label>
                        <Switch name="isAddOnEnabled" defaultChecked={editingSub?.isAddOnEnabled ?? true} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100">
                        <Label className="text-[10px] font-black uppercase">Default Selected</Label>
                        <Switch name="isDefaultAddOn" defaultChecked={editingSub?.isDefaultAddOn ?? false} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                  <Textarea name="description" defaultValue={editingSub?.description} className="bg-gray-50 border-none min-h-[100px]" />
                </div>
              </div>
              <DialogFooter className="p-6 bg-gray-50 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8 shadow-lg">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Sync Service</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Sub-Service</TableHead>
                <TableHead className="font-bold">Main Category</TableHead>
                <TableHead className="font-bold">Base Price</TableHead>
                <TableHead className="font-bold text-center">Add-on Mode</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : subServices?.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        {sub.imageUrl && <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{sub.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {sub.id.slice(0, 6)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px]">
                      {services?.find(s => s.id === sub.mainServiceId)?.title || 'Independent'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-sm text-gray-900">৳{sub.price?.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {sub.isAddOnEnabled ? (
                      <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black uppercase">Enabled</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-400 border-none text-[8px] font-black uppercase">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(sub)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(sub.id)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

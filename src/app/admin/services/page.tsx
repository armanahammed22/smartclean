
"use client";

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Trash2, Edit, Loader2, Save, Layers, Users, Clock, CheckCircle2, Image as ImageIcon, X, Settings2 } from 'lucide-react';
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

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mainImageUrl, setMainImageUrl] = useState('');

  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
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
      shortDescription: formData.get('shortDescription') as string,
      status: formData.get('status') as string || 'Active',
      categoryId: formData.get('categoryId') as string || 'Cleaning',
      imageUrl: mainImageUrl,
      isPopular: false,
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'services'), serviceData);
      toast({ title: "Service Added", description: "Base service created. Now add packages and add-ons." });
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
          <p className="text-muted-foreground text-sm">Control core service offerings and pricing models</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11 px-6 rounded-xl bg-primary hover:bg-primary/90">
              <Plus size={18} /> New Base Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-3xl p-8 overflow-hidden">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Create Base Service</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <ImageUploader onUpload={setMainImageUrl} initialUrl={mainImageUrl} label="Listing Thumbnail" aspectRatio="aspect-video" />
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Service Title</Label>
                  <Input name="title" required placeholder="e.g. Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Base Price</Label>
                    <Input name="basePrice" type="number" required placeholder="5000" className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Category</Label>
                    <Select name="categoryId" defaultValue="Cleaning">
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase">Short Summary</Label>
                  <Input name="shortDescription" placeholder="1-line highlight" className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Base Service"}
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
                <TableHead className="font-bold py-5 pl-8">Service Offering</TableHead>
                <TableHead className="font-bold">Starting Price</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : services?.map((service) => (
                <TableRow key={service.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                        {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs">{service.title}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{service.categoryId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-primary">৳{service.basePrice?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[9px] font-black uppercase border-none px-2", service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl gap-2 font-black text-[10px] uppercase border-primary/20 text-primary hover:bg-primary/5" asChild>
                        <Link href={`/admin/services/${service.id}`}><Settings2 size={14} /> Edit Details</Link>
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
        </CardContent>
      </Card>
    </div>
  );
}

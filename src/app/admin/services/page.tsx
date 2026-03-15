
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Trash2, Edit, Loader2, Save, Package, Layers, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Queries
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'service_categories')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products')) : null, [db]);
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services')) : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles')) : null, [db]);

  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: subServices } = useCollection(subServicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  const KPI_STATS = [
    { label: "Total Services", value: services?.length || 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Sub-Services", value: subServices?.length || 0, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Services", value: services?.filter(s => s.status === 'Active').length || 0, icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
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
      status: formData.get('status') as string || 'Active',
      categoryId: formData.get('categoryId') as string || 'general',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingService) {
        await updateDoc(doc(db, 'services', editingService.id), serviceData);
        toast({ title: "Service Updated" });
      } else {
        await addDoc(collection(db, 'services'), { ...serviceData, createdAt: new Date().toISOString() });
        toast({ title: "Service Added" });
      }
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this service?")) return;
    await deleteDoc(doc(db, 'services', id));
    toast({ title: "Service Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Operations</h1>
          <p className="text-muted-foreground text-sm">Manage core cleaning services and pricing models</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingService(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingService(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader><DialogTitle>{editingService ? 'Edit Service' : 'New Service Offering'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input name="title" defaultValue={editingService?.title} required placeholder="e.g. Deep Home Cleaning" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starts From (BDT)</Label>
                    <Input name="basePrice" type="number" defaultValue={editingService?.basePrice} required placeholder="2000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Duration</Label>
                    <Input name="duration" defaultValue={editingService?.duration} placeholder="2-3 hrs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="categoryId" defaultValue={editingService?.categoryId || "general"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingService?.status || "Active"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" defaultValue={editingService?.description} placeholder="What's included?" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Service
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Service Details</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Base Price</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Syncing services...</TableCell></TableRow>
              ) : services?.length ? (
                services.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-900 leading-tight">{service.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock size={10} /> {service.duration || 'Variable'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium uppercase">{service.categoryId}</TableCell>
                    <TableCell className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none uppercase",
                        service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingService(service); setIsDialogOpen(true); }}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(service.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No services configured.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

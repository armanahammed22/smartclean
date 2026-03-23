
"use client";

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Trash2, Edit, Loader2, Save, Wrench, Clock, Users, Package, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SubServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Queries
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles')) : null, [db]);

  const { data: subServices, isLoading } = useCollection(subServicesQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  const KPI_STATS = [
    { label: "Sub-Services", value: subServices?.length || 0, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Main Services", value: services?.length || 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active Operations", value: services?.filter(s => s.status === 'Active').length || 0, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Staff", value: employees?.length || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const subData = {
      name: formData.get('name') as string,
      mainServiceId: formData.get('mainServiceId') as string,
      price: parseFloat(formData.get('price') as string),
      duration: formData.get('duration') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string || 'Active',
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
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save task." });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Task Add-ons (Sub-Services)</h1>
          <p className="text-muted-foreground text-sm">Configure specialized tasks that can be added to main bookings</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingSub(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingSub(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add Sub-Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tight">{editingSub ? 'Edit Task' : 'New Sub-Service Task'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Task Name</Label>
                  <Input name="name" defaultValue={editingSub?.name} required placeholder="e.g. Kitchen Cabinet Cleaning" className="h-11 bg-gray-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Link to Main Service</Label>
                  <Select name="mainServiceId" defaultValue={editingSub?.mainServiceId || ""}>
                    <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue placeholder="Select Parent Service" /></SelectTrigger>
                    <SelectContent>
                      {services?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Price (BDT)</Label>
                    <Input name="price" type="number" defaultValue={editingSub?.price} required placeholder="500" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Duration</Label>
                    <Input name="duration" defaultValue={editingSub?.duration} placeholder="1 hr" className="h-11 bg-gray-50 border-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</Label>
                  <Select name="status" defaultValue={editingSub?.status || "Active"}>
                    <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description</Label>
                  <Textarea name="description" defaultValue={editingSub?.description} className="bg-gray-50 border-none" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold px-8">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
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
                <TableHead className="font-bold py-5 pl-8">Sub-Service Name</TableHead>
                <TableHead className="font-bold">Parent Service</TableHead>
                <TableHead className="font-bold">Add-on Price</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Loading tasks...</TableCell></TableRow>
              ) : subServices?.length ? (
                subServices.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-5 pl-8">
                      <div className="font-bold text-gray-900 leading-tight">{sub.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock size={10} /> {sub.duration}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-indigo-600">
                      {services?.find(s => s.id === sub.mainServiceId)?.title || 'Independent'}
                    </TableCell>
                    <TableCell className="font-black text-primary text-sm">৳{sub.price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-black uppercase border-none px-2 py-0.5 rounded-md",
                        sub.status === 'Inactive' ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700"
                      )}>
                        {sub.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setEditingSub(sub); setIsDialogOpen(true); }}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => handleDelete(sub.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No tasks added yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

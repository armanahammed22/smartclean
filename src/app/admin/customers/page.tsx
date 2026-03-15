'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  Mail, 
  MapPin, 
  Trash2,
  Edit,
  Loader2,
  Save,
  Users,
  Star,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

export default function CustomersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'customers'), orderBy('name', 'asc'));
  }, [db]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const filtered = customers?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const customerData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      segment: formData.get('segment') as string || 'Regular',
      totalSpent: editingCustomer?.totalSpent || 0,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
        toast({ title: "Customer Updated" });
      } else {
        await addDoc(collection(db, 'customers'), { ...customerData, createdAt: new Date().toISOString() });
        toast({ title: "Customer Registered" });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete customer profile?")) return;
    await deleteDoc(doc(db, 'customers', id));
    toast({ title: "Customer Removed" });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground text-sm">Manage client database and engagement history</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCustomer(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold h-11 shadow-lg" onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }}>
              <UserPlus size={18} /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <DialogHeader><DialogTitle>{editingCustomer ? 'Edit Client' : 'New Client Registration'}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="name" defaultValue={editingCustomer?.name} required placeholder="Client Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="phone" defaultValue={editingCustomer?.phone} required placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" defaultValue={editingCustomer?.email} type="email" placeholder="client@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input name="address" defaultValue={editingCustomer?.address} placeholder="Location / Area" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Total Clients</p>
              <h3 className="text-3xl font-black mt-1">{customers?.length || 0}</h3>
            </div>
            <Users size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">VIP Segments</p>
              <h3 className="text-3xl font-black mt-1">
                {customers?.filter(c => c.segment === 'VIP' || (c.totalSpent || 0) > 50000).length || 0}
              </h3>
            </div>
            <Star size={40} className="text-amber-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active This Month</p>
              <h3 className="text-3xl font-black mt-1">
                {Math.ceil((customers?.length || 0) * 0.4)}
              </h3>
            </div>
            <Wallet size={40} className="text-green-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by name, phone or email..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2"><Filter size={18} /> Segmentation</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Customer</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Total Spent</TableHead>
                <TableHead className="font-bold">Segment</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Loading directory...</TableCell></TableRow>
              ) : filtered?.length ? (
                filtered.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{customer.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-sm">{customer.name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} /> {customer.address || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium"><Phone size={10} className="text-primary" /> {customer.phone}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Mail size={10} /> {customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-black text-sm text-primary">৳{customer.totalSpent?.toLocaleString() || '0'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">
                        {customer.segment || 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingCustomer(customer); setIsDialogOpen(true); }}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(customer.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 italic text-muted-foreground">No customers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

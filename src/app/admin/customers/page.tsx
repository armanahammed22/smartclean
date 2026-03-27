'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  Mail, 
  Trash2,
  Edit,
  Loader2,
  Save,
  Users,
  Star,
  UserCheck,
  Lock,
  LayoutDashboard,
  ShieldAlert,
  MoreVertical,
  XCircle,
  Shield,
  Clock
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [removalTarget, setRemovalTarget] = useState<any>(null);
  const [removalType, setRemovalType] = useState<'delete' | 'block' | null>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const stats = useMemo(() => {
    if (!customers) return { total: 0, active: 0, new: 0 };
    return {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      new: customers.filter(c => {
        const joinDate = new Date(c.createdAt || 0);
        const today = new Date();
        return joinDate.getMonth() === today.getMonth() && joinDate.getFullYear() === today.getFullYear();
      }).length
    };
  }, [customers]);

  const filtered = customers?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered?.map(c => c.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} profiles?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'users', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Profiles Removed" });
    } catch (e) {} finally {
      setIsBulkProcessing(false);
    }
  };

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
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingCustomer) {
        await updateDoc(doc(db, 'users', editingCustomer.id), customerData);
        toast({ title: "Profile Updated" });
      } else {
        await addDoc(collection(db, 'users'), { 
          ...customerData, 
          uid: 'temp-' + Date.now(), 
          createdAt: new Date().toISOString(),
          totalEarnings: 0,
          role: 'customer',
          status: 'active'
        });
        toast({ title: "Customer Created" });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoval = async () => {
    if (!db || !removalTarget) return;
    setIsSubmitting(true);

    try {
      if (removalType === 'block') {
        await addDoc(collection(db, 'blocked_users'), {
          email: removalTarget.email,
          phone: removalTarget.phone,
          blockedAt: new Date().toISOString(),
          reason: 'Administrative Block'
        });
      }
      await deleteDoc(doc(db, 'users', removalTarget.id));
      setRemovalTarget(null);
      setRemovalType(null);
      toast({ title: removalType === 'block' ? "Account Blocked" : "Account Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReset = async (email: string) => {
    if (!email || !auth) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Email Sent", description: `Sent to ${email}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return <Badge className="bg-red-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Admin</Badge>;
      case 'staff': return <Badge className="bg-orange-50 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Staff</Badge>;
      default: return <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0.5">Customer</Badge>;
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground text-sm">Oversee registered profiles and access levels</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCustomer(null); }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto gap-2 font-bold h-11 shadow-lg" onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }}>
              <UserPlus size={18} /> Register Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-t-[2rem] md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
            <form onSubmit={handleSaveCustomer} className="flex flex-col">
              <DialogHeader className="p-6 bg-[#081621] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingCustomer ? 'Edit Client Profile' : 'New Client Registration'}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                  <Input name="name" defaultValue={editingCustomer?.name} required placeholder="Client Name" className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number</Label>
                  <Input name="phone" defaultValue={editingCustomer?.phone} required placeholder="01XXXXXXXXX" className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Address</Label>
                  <Input name="email" defaultValue={editingCustomer?.email} type="email" required placeholder="client@example.com" className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Address</Label>
                  <Input name="address" defaultValue={editingCustomer?.address} placeholder="Location / Area" className="h-11 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
              <DialogFooter className="p-6 bg-gray-50 border-t flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8 w-full sm:w-auto shadow-lg shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Information
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Members", val: stats.total, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Active Now", val: stats.active, icon: UserCheck, bg: "bg-green-50", color: "text-green-600" },
          { label: "New (This Month)", val: stats.new, icon: Clock, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Verified Clients", val: customers?.filter(c => !!c.phone).length || 0, icon: ShieldCheck, bg: "bg-primary/5", color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by name, phone, email or UID..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200 w-full md:w-auto"><Filter size={18} /> Filters</Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#081621] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} ACCOUNTS SELECTED</span>
          </div>
          <Button variant="ghost" onClick={handleBulkDelete} disabled={isBulkProcessing} className="text-white hover:bg-red-500 font-black uppercase text-[10px] h-8">
            <Trash2 size={14} className="mr-2" /> Delete Profiles
          </Button>
        </div>
      )}

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={filtered?.length ? selectedIds.length === filtered.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Customer Identity</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Access Level</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Contact Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
                ) : filtered?.length ? (
                  filtered.map((customer) => (
                    <TableRow key={customer.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(customer.id) && "bg-primary/5")}>
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedIds.includes(customer.id)}
                          onCheckedChange={() => toggleSelect(customer.id)}
                        />
                      </TableCell>
                      <TableCell className="py-5 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{customer.name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm text-gray-900 leading-tight uppercase">{customer.name || 'Anonymous'}</div>
                            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">ID: {customer.id.slice(0, 12)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(customer.role)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><Phone size={10} className="text-primary" /> {customer.phone || 'N/A'}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Mail size={10} /> {customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant="secondary" className={cn(
                           "text-[8px] font-black uppercase border-none px-2",
                           customer.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                         )}>
                           {customer.status || 'Active'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild title="Dashboard">
                            <Link href={`/admin/customers/${customer.id}/dashboard`}><LayoutDashboard size={14} /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => handleSendReset(customer.email)} title="Reset Pass">
                            <Lock size={14} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical size={14} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-2 border-none shadow-xl bg-white">
                              <DropdownMenuItem className="text-amber-600 font-bold gap-2 cursor-pointer rounded-lg" onClick={() => { setRemovalTarget(customer); setRemovalType('delete'); }}><Trash2 size={14} /> Delete Profile</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive font-black gap-2 cursor-pointer rounded-lg" onClick={() => { setRemovalTarget(customer); setRemovalType('block'); }}><XCircle size={14} /> Blacklist User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">No matching profiles found in the registry.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!removalTarget} onOpenChange={(o) => { if(!o) setRemovalTarget(null); }}>
        <AlertDialogContent className="rounded-t-[2rem] md:rounded-[2rem] max-w-md w-[95vw] bg-white border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {removalType === 'block' ? <XCircle className="text-destructive" /> : <Trash2 className="text-amber-600" />}
              {removalType === 'block' ? 'Permanent Blacklist' : 'Remove Profile'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              {removalType === 'block' 
                ? `Are you sure you want to block ${removalTarget?.name}? Their access will be revoked immediately.` 
                : `This will remove ${removalTarget?.name}'s profile and login access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoval} 
              className={cn("rounded-xl font-black px-8 w-full sm:w-auto shadow-lg", removalType === 'block' ? "bg-destructive hover:bg-destructive/90" : "bg-amber-600 hover:bg-amber-700")}
            >
              {removalType === 'block' ? 'Block Access' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
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
  Shield
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
  
  const [removalTarget, setRemovalTarget] = useState<any>(null);
  const [removalType, setRemovalType] = useState<'delete' | 'block' | null>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const filtered = customers?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.includes(searchTerm)
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
      case 'staff': return <Badge className="bg-orange-500 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Staff</Badge>;
      case 'manager': return <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5">Manager</Badge>;
      default: return <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0.5">Customer</Badge>;
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground text-sm">Manage registered users and oversee client accounts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCustomer(null); }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto gap-2 font-bold h-11 shadow-lg" onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }}>
              <UserPlus size={18} /> Register Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-t-[2rem] md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <form onSubmit={handleSaveCustomer} className="flex flex-col">
              <DialogHeader className="p-6 bg-[#081621] text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingCustomer ? 'Edit Client Profile' : 'New Client Registration'}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input name="name" defaultValue={editingCustomer?.name} required placeholder="Client Name" className="h-11 bg-gray-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                  <Input name="phone" defaultValue={editingCustomer?.phone} required placeholder="01XXXXXXXXX" className="h-11 bg-gray-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <Input name="email" defaultValue={editingCustomer?.email} type="email" required placeholder="client@example.com" className="h-11 bg-gray-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Address</Label>
                  <Input name="address" defaultValue={editingCustomer?.address} placeholder="Location / Area" className="h-11 bg-gray-50 border-none" />
                </div>
              </div>
              <DialogFooter className="p-6 bg-gray-50 border-t flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8 w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Information
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Customer Identity</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Platform Role</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Contact Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
                ) : filtered?.length ? (
                  filtered.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{customer.name?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm text-gray-900 leading-tight">{customer.name || 'Anonymous'}</div>
                            <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">UID: {customer.id.slice(0, 12)}...</div>
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
                      <TableCell>
                         <Badge variant="secondary" className={cn(
                           "text-[8px] font-black uppercase border-none",
                           customer.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                         )}>
                           {customer.status || 'Active'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild title="View Dashboard">
                            <Link href={`/admin/customers/${customer.id}/dashboard`}>
                              <LayoutDashboard size={14} />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => handleSendReset(customer.email)} title="Send Password Reset">
                            <Lock size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" asChild title="Promote Role">
                            <Link href={`/admin/roles?uid=${customer.id}`}>
                              <Shield size={14} />
                            </Link>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl p-2 border-none shadow-xl">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">Removal Options</DropdownMenuLabel>
                              <DropdownMenuItem 
                                className="text-amber-600 font-bold gap-2 cursor-pointer rounded-lg"
                                onClick={() => { setRemovalTarget(customer); setRemovalType('delete'); }}
                              >
                                <Trash2 size={14} /> Normal Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive font-black gap-2 cursor-pointer rounded-lg"
                                onClick={() => { setRemovalTarget(customer); setRemovalType('block'); }}
                              >
                                <XCircle size={14} /> Permanent Block
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No matching profiles found in the registry.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!removalTarget} onOpenChange={(o) => { if(!o) setRemovalTarget(null); }}>
        <AlertDialogContent className="rounded-t-[2rem] md:rounded-[2rem] max-w-md w-[95vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {removalType === 'block' ? <XCircle className="text-destructive" /> : <Trash2 className="text-amber-600" />}
              {removalType === 'block' ? 'Permanent Blacklist' : 'Delete Account'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              {removalType === 'block' 
                ? `Are you sure you want to block ${removalTarget?.name}? Their email (${removalTarget?.email}) and phone will be blacklisted.` 
                : `This will remove ${removalTarget?.name}'s profile from the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoval} 
              className={cn("rounded-xl font-black px-8 w-full sm:w-auto", removalType === 'block' ? "bg-destructive hover:bg-destructive/90" : "bg-amber-600 hover:bg-amber-700")}
            >
              {removalType === 'block' ? 'Confirm Block' : 'Delete Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

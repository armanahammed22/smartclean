
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
  XCircle
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
  
  // State for deletion/blocking
  const [removalTarget, setRemovalTarget] = useState<any>(null);
  const [removalType, setRemovalType] = useState<'delete' | 'block' | null>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'customer_profiles'), orderBy('createdAt', 'desc'));
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
        await updateDoc(doc(db, 'customer_profiles', editingCustomer.id), customerData);
        toast({ title: "Profile Updated", description: "The customer record has been modified." });
      } else {
        await addDoc(collection(db, 'customer_profiles'), { 
          ...customerData, 
          uid: 'temp-' + Date.now(), // Real UID comes from Auth, but profile needs a ref
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
      toast({ variant: "destructive", title: "Error", description: "Operation failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoval = async () => {
    if (!db || !removalTarget) return;
    setIsSubmitting(true);

    try {
      if (removalType === 'block') {
        // Add to blocked_users blacklist
        await addDoc(collection(db, 'blocked_users'), {
          email: removalTarget.email,
          phone: removalTarget.phone,
          blockedAt: new Date().toISOString(),
          reason: 'Administrative Block'
        });
        toast({ title: "Customer Blocked", description: "User credentials have been blacklisted." });
      }

      // Delete the actual profile document
      await deleteDoc(doc(db, 'customer_profiles', removalTarget.id));
      
      // Cleanup UI
      setRemovalTarget(null);
      setRemovalType(null);
      toast({ title: removalType === 'block' ? "Account Blocked" : "Account Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not complete operation." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReset = async (email: string) => {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Reset Email Sent", description: `A recovery link was sent to ${email}` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground text-sm">Manage registered users and oversee client accounts</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCustomer(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold h-11 shadow-lg" onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }}>
              <UserPlus size={18} /> Register Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tight">{editingCustomer ? 'Edit Client Profile' : 'New Client Registration'}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 gap-4 pt-4">
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
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Information
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Total Registered</p>
              <h3 className="text-3xl font-black mt-1">{customers?.length || 0}</h3>
            </div>
            <Users size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Status</p>
              <h3 className="text-3xl font-black mt-1 text-primary">
                {customers?.filter(c => c.status === 'active').length || 0}
              </h3>
            </div>
            <UserCheck size={40} className="text-primary opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Blocked Accounts</p>
              <h3 className="text-3xl font-black mt-1 text-destructive">
                {customers?.filter(c => c.status === 'banned').length || 0}
              </h3>
            </div>
            <ShieldAlert size={40} className="text-destructive opacity-20" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by name, phone, email or UID..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Customer Identity</TableHead>
                <TableHead className="font-bold">Contact Details</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Role Management</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><Phone size={10} className="text-primary" /> {customer.phone || 'N/A'}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Mail size={10} /> {customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className={cn(
                         "text-[9px] font-black uppercase border-none",
                         customer.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                       )}>
                         {customer.status || 'Active'}
                       </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-white transition-all rounded-full px-4">
                        <Link href={`/admin/roles?uid=${customer.id}`}>
                          <UserCheck size={12} /> Promote
                        </Link>
                      </Button>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => { setEditingCustomer(customer); setIsDialogOpen(true); }} title="Edit Profile">
                          <Edit size={14} />
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
        </CardContent>
      </Card>

      {/* Removal Confirmation Dialog */}
      <AlertDialog open={!!removalTarget} onOpenChange={(o) => { if(!o) setRemovalTarget(null); }}>
        <AlertDialogContent className="rounded-[2rem] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {removalType === 'block' ? <XCircle className="text-destructive" /> : <Trash2 className="text-amber-600" />}
              {removalType === 'block' ? 'Permanent Blacklist' : 'Delete Account'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              {removalType === 'block' 
                ? `Are you sure you want to block ${removalTarget?.name}? Their email (${removalTarget?.email}) and phone will be blacklisted, preventing any future registration.` 
                : `This will remove ${removalTarget?.name}'s profile from the system. They will be able to register again in the future.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoval} 
              className={cn("rounded-xl font-black px-8", removalType === 'block' ? "bg-destructive hover:bg-destructive/90" : "bg-amber-600 hover:bg-amber-700")}
            >
              {removalType === 'block' ? 'Confirm Block' : 'Delete Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

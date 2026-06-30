'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useAuth, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch, getDocs, where, setDoc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  UserCheck,
  Lock,
  LayoutDashboard,
  MoreVertical,
  XCircle,
  ShieldCheck,
  Clock,
  RefreshCw,
  Database,
  Zap
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
  const { user } = useUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [removalTarget, setRemovalTarget] = useState<any>(null);
  const [removalType, setRemovalType] = useState<'delete' | 'block' | null>(null);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  }, [db, user]);

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
    if (filtered && selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered?.map(c => c.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  /**
   * 🚀 DATA MIGRATION & REGISTRY SYNC
   */
  const handleSyncRegistry = async () => {
    if (!db) return;
    setIsSyncing(true);
    toast({ title: "Migration Started", description: "Scanning all ledger records..." });

    try {
      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
      
      const invoices = invoicesSnap.docs.map(d => ({ ...d.data(), id: d.id }));
      const existingUsers = usersSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      const phoneMap: Record<string, any> = {};

      invoices.forEach((inv: any) => {
        const phone = inv.customerInfo?.phone;
        if (!phone) return;

        if (!phoneMap[phone]) {
          phoneMap[phone] = {
            name: inv.customerInfo.name,
            address: inv.customerInfo.address,
            email: inv.customerInfo.email || '',
            totalInvoiced: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            invoiceIds: []
          };
        }

        phoneMap[phone].totalInvoiced += (inv.total || 0);
        phoneMap[phone].totalPaid += (inv.paidAmount || 0);
        phoneMap[phone].outstandingBalance += (inv.dueAmount || 0);
        phoneMap[phone].invoiceIds.push(inv.id);
      });

      let updatedCount = 0;
      let createdCount = 0;

      for (const phone in phoneMap) {
        const stats = phoneMap[phone];
        const existing = existingUsers.find(u => u.phone === phone);

        const userData = {
          name: stats.name,
          phone: phone,
          email: stats.email,
          address: stats.address,
          totalInvoiced: stats.totalInvoiced,
          totalPaid: stats.totalPaid,
          outstandingBalance: stats.outstandingBalance,
          role: 'customer',
          status: 'active',
          updatedAt: new Date().toISOString()
        };

        if (existing) {
          await updateDoc(doc(db, 'users', existing.id), userData);
          updatedCount++;
        } else {
          const newRef = doc(collection(db, 'users'));
          await setDoc(newRef, {
            ...userData,
            uid: newRef.id,
            createdAt: new Date().toISOString()
          });
          createdCount++;
        }

        for (const invId of stats.invoiceIds) {
          await updateDoc(doc(db, 'invoices', invId), { 
            customerId: existing ? existing.id : null 
          });
        }
      }

      toast({ 
        title: "Sync Complete", 
        description: `Refined ${updatedCount} profiles and created ${createdCount} new records.` 
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
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
          totalInvoiced: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          role: 'customer',
          status: 'active'
        });
        toast({ title: "Customer Created" });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving Data" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoval = async () => {
    if (!db || !removalTarget) return;
    setIsSubmitting(true);

    try {
      if (removalType === 'block') {
        await updateDoc(doc(db, 'users', removalTarget.id), { status: 'disabled' });
      } else {
        await deleteDoc(doc(db, 'users', removalTarget.id));
      }
      setRemovalTarget(null);
      setRemovalType(null);
      toast({ title: removalType === 'block' ? "Account Blocked" : "Account Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
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
      toast({ title: "Bulk Profile Removal Completed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Bulk Delete Failed" });
    } finally {
      setIsBulkProcessing(false);
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
      case 'admin': return <Badge className="bg-red-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 shadow-sm">Root Admin</Badge>;
      case 'staff': return <Badge className="bg-orange-50 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 shadow-sm">Field Tech</Badge>;
      case 'manager': return <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 shadow-sm">Manager</Badge>;
      default: return <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0.5 border-none bg-gray-100 text-gray-500">Customer</Badge>;
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Customer Intelligence</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <Users className="text-primary" size={16} /> Oversee all registered profiles and account statuses
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncRegistry} 
            disabled={isSyncing}
            className="rounded-xl font-bold h-11 px-6 border-primary/20 text-primary gap-2 bg-white"
          >
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Sync & Repair Registry
          </Button>
          <Button onClick={() => { setEditingCustomer(null); setIsDialogOpen(true); }} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs">
            <UserPlus size={18} /> Enroll Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Partners", val: stats.total, icon: Users, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Active Session", val: stats.active, icon: UserCheck, bg: "bg-green-50", color: "text-green-600" },
          { label: "Growth (MTD)", val: stats.new, icon: Clock, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Verified Data", val: customers?.filter(c => !!c.phone).length || 0, icon: ShieldCheck, bg: "bg-primary/5", color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner", s.bg, s.color)}><s.icon size={22} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search by identity, phone or email..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] shadow-lg animate-in zoom-in-95" onClick={handleBulkDelete} disabled={isBulkProcessing}>
              Purge ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" className="h-12 px-6 gap-2 rounded-2xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem] border border-gray-100">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow className="border-none">
                  <TableHead className="w-16 pl-8">
                    <Checkbox 
                      checked={filtered?.length ? selectedIds.length === filtered.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-black py-6 pl-2 uppercase text-[10px] tracking-widest text-[#081621]">Identity & Role</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Contact Matrix</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Billing Insights</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-[#081621]">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Control</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
                ) : filtered?.length ? (
                  filtered.map((customer) => (
                    <TableRow key={customer.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(customer.id) && "bg-primary/5")}>
                      <TableCell className="pl-8">
                        <Checkbox 
                          checked={selectedIds.includes(customer.id)}
                          onCheckedChange={() => toggleSelect(customer.id)}
                        />
                      </TableCell>
                      <TableCell className="py-6 pl-2">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{customer.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1.5 truncate max-w-[150px]">{customer.name || 'ANONYMOUS'}</div>
                            {getRoleBadge(customer.role)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700"><Phone size={12} className="text-primary" /> {customer.phone || 'N/A'}</div>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium uppercase"><Mail size={12} className="text-gray-300" /> {customer.email || 'NO EMAIL'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-black text-gray-900">৳{customer.totalPaid?.toLocaleString() || 0}</p>
                               <span className="text-[8px] font-black text-emerald-600 uppercase">Collected</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black text-rose-500">৳{customer.outstandingBalance?.toLocaleString() || 0}</p>
                               <span className="text-[8px] font-bold text-gray-400 uppercase">Receivable</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge className={cn(
                           "text-[8px] font-black uppercase border-none px-2.5 py-1 rounded-lg shadow-sm",
                           customer.status === 'active' ? "bg-emerald-50 text-emerald-700 shadow-sm" : "bg-red-50 text-red-700"
                         )}>
                           {customer.status || 'Active'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" asChild title="Intelligence Dashboard">
                            <Link href={`/admin/customers/${customer.id}/dashboard`}><LayoutDashboard size={18} /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-xl" onClick={() => { setEditingCustomer(customer); setIsDialogOpen(true); }} title="Modify Metadata">
                            <Edit size={18} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400"><MoreVertical size={18} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl bg-white min-w-[160px]">
                              <DropdownMenuItem className="text-amber-600 font-bold gap-2 cursor-pointer rounded-xl py-2.5" onClick={() => handleSendReset(customer.email)}><Lock size={14} /> Send Password Reset</DropdownMenuItem>
                              <DropdownMenuItem className="text-rose-600 font-black gap-2 cursor-pointer rounded-xl py-2.5" onClick={() => { setRemovalTarget(customer); setRemovalType('block'); }}><XCircle size={14} /> Block Session</DropdownMenuItem>
                              <DropdownMenuItem className="text-gray-400 font-bold gap-2 cursor-pointer rounded-xl py-2.5" onClick={() => { setRemovalTarget(customer); setRemovalType('delete'); }}><Trash2 size={14} /> Remove Account</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No intelligence matching search found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ENROLLMENT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if(!o) setEditingCustomer(null); }}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <form onSubmit={handleSaveCustomer} className="flex flex-col">
            <DialogHeader className="p-8 bg-[#081621] text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20"><UserPlus size={24}/></div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">
                    {editingCustomer ? 'Update Identity' : 'Enroll New Partner'}
                  </DialogTitle>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">Registry Record Management</p>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8 space-y-5 bg-white">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Legal Name</Label>
                <Input name="name" defaultValue={editingCustomer?.name} required placeholder="Full Identity Label" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Protocol</Label>
                <Input name="phone" defaultValue={editingCustomer?.phone} required placeholder="01XXXXXXXXX" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Digital Mail</Label>
                <Input name="email" defaultValue={editingCustomer?.email} type="email" placeholder="email@address.com" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Location Repository</Label>
                <Textarea name="address" defaultValue={editingCustomer?.address} placeholder="Site / Delivery Address" className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4 shadow-inner" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] h-12 flex-1">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8 h-12 flex-1 shadow-xl shadow-primary/20 uppercase tracking-tighter text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Records</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removalTarget} onOpenChange={(o) => { if(!o) setRemovalTarget(null); }}>
        <AlertDialogContent className="rounded-[2rem] max-w-md w-[95vw] bg-white border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {removalType === 'block' ? <XCircle className="text-rose-600" /> : <Trash2 className="text-amber-600" />}
              {removalType === 'block' ? 'Blacklist Protocol' : 'Purge Registry'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              {removalType === 'block' 
                ? `Revoking access for ${removalTarget?.name}. Their credentials will be invalidated immediately.` 
                : `Permanently removing ${removalTarget?.name} from intelligence registry.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold flex-1 h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoval} 
              className={cn("rounded-xl font-black px-8 flex-1 h-12 shadow-lg", removalType === 'block' ? "bg-rose-600" : "bg-[#081621]")}
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

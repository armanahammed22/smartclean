'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, addDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  CreditCard,
  History,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Wallet
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { createLedgerEntry } from '@/lib/finance-utils';

export default function StaffSalariesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    staffId: '',
    amount: '',
    adjustments: '0',
    date: format(new Date(), 'yyyy-MM-dd'),
    accountId: '',
    paidStatus: 'Paid' as 'Paid' | 'Unpaid'
  });

  const staffQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), orderBy('name', 'asc')) : null, [db, user]);
  const payrollQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'finance_staff_salaries'), orderBy('date', 'desc')) : null, [db, user]);
  const accountsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'finance_accounts') : null, [db, user]);

  const { data: staffList } = useCollection(staffQuery);
  const { data: payroll, isLoading } = useCollection(payrollQuery);
  const { data: accounts } = useCollection(accountsQuery);

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const staff = staffList?.find(s => s.id === formData.staffId);
    const totalAmount = (parseFloat(formData.amount) || 0) + (parseFloat(formData.adjustments) || 0);

    try {
      // 1. Create Salary Record
      await addDoc(collection(db, 'finance_staff_salaries'), {
        ...formData,
        staffName: staff?.name || 'Unknown',
        totalAmount,
        createdAt: new Date().toISOString()
      });

      // 2. Add to Master Ledger
      await createLedgerEntry(db, {
        type: 'expense',
        category: 'Staff Salary',
        staffId: formData.staffId,
        amount: totalAmount,
        paidStatus: formData.paidStatus,
        date: new Date(formData.date).toISOString(),
        accountId: formData.accountId,
        notes: `Salary for ${staff?.name} - ${format(parseISO(formData.date), 'MMMM yyyy')}`
      });

      toast({ title: "Payroll Recorded" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Processing" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/finance"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Staff Payroll</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Salary Registry & Payments</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
          <Plus size={18} /> Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Active Personnel</p>
              <h3 className="text-3xl font-black text-gray-900">{staffList?.length || 0}</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Payroll (This Month)</p>
              <h3 className="text-3xl font-black text-rose-600">৳{payroll?.reduce((a,c) => a + (c.totalAmount || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={100} /></div>
          <CardContent className="p-6 relative z-10 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Career Payroll</p>
              <h3 className="text-3xl font-black">৳1.2M</h3>
            </div>
            <Badge className="bg-primary text-white border-none">HEALTHY</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-gray-50/50 border-b p-8">
          <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2"><History size={18} className="text-primary"/> Payroll History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Personnel</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Pay Period</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline text-primary" /></TableCell></TableRow>
              ) : payroll?.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">{p.staffName?.[0]}</div>
                      <div className="font-black text-gray-900 uppercase text-xs">{p.staffName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] font-black text-gray-500 uppercase">{format(parseISO(p.date), 'MMMM yyyy')}</div>
                  </TableCell>
                  <TableCell className="font-black text-gray-900 text-sm">৳{p.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black uppercase px-2 border-none",
                      p.paidStatus === 'Paid' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {p.paidStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-xl opacity-0 group-hover:opacity-100 transition-all" onClick={() => deleteDoc(doc(db!, 'finance_staff_salaries', p.id))}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl"><CreditCard size={20} /></div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Salary Entry</DialogTitle>
            </div>
          </header>
          <form onSubmit={handlePaySalary} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Staff Member</Label>
              <Select value={formData.staffId} onValueChange={v => setFormData({...formData, staffId: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Choose Personnel" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {staffList?.map(s => <SelectItem key={s.id} value={s.id} className="font-bold text-[10px] uppercase">{s.name} ({s.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Base Amount (৳)</Label>
                <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Bonus/Adj (৳)</Label>
                <Input type="number" value={formData.adjustments} onChange={e => setFormData({...formData, adjustments: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Pay for Month</Label>
              <Input type="month" value={formData.date.slice(0,7)} onChange={e => setFormData({...formData, date: e.target.value + '-01'})} required className="h-12 bg-gray-50 border-none rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Source Account</Label>
              <Select value={formData.accountId} onValueChange={v => setFormData({...formData, accountId: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Choose Account" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl mt-4">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Process Payroll"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

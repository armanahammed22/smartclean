'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  ArrowLeft, 
  Wallet, 
  Building2, 
  Smartphone,
  Info,
  ArrowRightLeft,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function FinanceAccountsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank' as any,
    accountNumber: '',
    balance: '0'
  });

  const accountsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'finance_accounts'), orderBy('createdAt', 'asc')) : null, [db, user]);
  const { data: accounts, isLoading } = useCollection(accountsQuery);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'finance_accounts'), {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Account Initialized" });
      setIsDialogOpen(false);
      setFormData({ name: '', type: 'Bank', accountNumber: '', balance: '0' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!db || !confirm("Delete this account?")) return;
    await deleteDoc(doc(db, 'finance_accounts', id));
    toast({ title: "Account Removed" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/finance"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Bank & Cash Accounts</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Real-time Liquid Assets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
            <Plus size={18} /> Initialize Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary"/></div> : accounts?.map((acc) => (
            <Card key={acc.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                      {acc.type === 'Bank' ? <Building2 size={24}/> : acc.type === 'Mobile Wallet' ? <Smartphone size={24}/> : <Wallet size={24}/>}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{acc.name}</h3>
                      <p className="text-[10px] font-mono font-bold text-muted-foreground">{acc.accountNumber || '---'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteAccount(acc.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Current Balance</p>
                  <h4 className="text-3xl font-black text-[#081621] tracking-tighter">৳{acc.balance?.toLocaleString()}</h4>
                </div>
                <div className="pt-6 mt-6 border-t border-gray-50 flex justify-between items-center">
                  <Badge variant="outline" className="text-[8px] font-black border-none bg-green-50 text-green-700 uppercase px-2">{acc.status}</Badge>
                  <Button variant="ghost" className="h-8 text-[10px] font-black uppercase text-primary gap-1">Transfer <ArrowRightLeft size={12}/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900 mb-4 flex items-center gap-2">
              <Info size={16} /> Liquidity Hint
            </CardTitle>
            <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
              Transactions from the Ledger automatically update these balances. Manual adjustments should be recorded as "Other" income or expense.
            </p>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-widest">Connect Account</DialogTitle>
          </header>
          <form onSubmit={handleAddAccount} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Account Provider Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. City Bank / bKash" required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Account Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Bank', 'Cash', 'Mobile Wallet'].map(t => <SelectItem key={t} value={t} className="font-bold text-[10px] uppercase">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Account/Reference Number</Label>
              <Input value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} placeholder="e.g. 120-XXX..." className="h-12 bg-gray-50 border-none rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1 text-primary">Initial Opening Balance (৳)</Label>
              <Input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl mt-4">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Activate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
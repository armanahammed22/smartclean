'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  ArrowLeft, 
  Receipt, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  X,
  PlusCircle,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { createLedgerEntry } from '@/lib/finance-utils';

export default function LedgerManagementPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Other',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    paidStatus: 'Paid' as 'Paid' | 'Unpaid',
    accountId: '',
    notes: ''
  });

  const ledgerQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db, user]);
  const accountsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'finance_accounts') : null, [db, user]);
  
  const { data: ledger, isLoading } = useCollection(ledgerQuery);
  const { data: accounts } = useCollection(accountsQuery);

  const filtered = useMemo(() => {
    return ledger?.filter(l => 
      l.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ledger, searchTerm]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);
    try {
      await createLedgerEntry(db, {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        date: new Date(formData.date).toISOString(),
      } as any);
      
      toast({ title: "Entry Recorded" });
      setIsDialogOpen(false);
      setFormData({ type: 'expense', category: 'Other', amount: '', date: format(new Date(), 'yyyy-MM-dd'), paidStatus: 'Paid', accountId: '', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePaidStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Paid' ? 'Unpaid' : 'Paid';
    await updateDoc(doc(db, 'finance_ledger', id), { paidStatus: next });
    toast({ title: "Status Updated" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/finance"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Master Ledger</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Transaction Log & Control</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export CSV</Button>
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
            <PlusCircle size={18} /> New Entry
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Filter by category, notes or reference..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest text-[#081621]">Timeline</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Category & Source</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="text-[10px] font-black text-gray-400 uppercase">{format(parseISO(item.date), 'MMM dd, yyyy')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl shadow-inner", item.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                        {item.type === 'income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{item.category}</div>
                        <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">{item.notes || 'No notes provided'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={cn("font-black text-sm", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => togglePaidStatus(item.id, item.paidStatus)}>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase border-none px-2",
                        item.paidStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.paidStatus}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-xl hover:bg-red-50" onClick={() => deleteDoc(doc(db!, 'finance_ledger', item.id))}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl"><FileText size={20} /></div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Manual Entry</DialogTitle>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </header>
          <form onSubmit={handleAddEntry} className="p-8 space-y-5">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", formData.type === 'income' ? "bg-emerald-600 text-white" : "text-gray-400")}>Income</button>
              <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", formData.type === 'expense' ? "bg-rose-600 text-white" : "text-gray-400")}>Expense</button>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v as any})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["Staff Salary", "Material Cost", "Vendor Commission", "Partner Commission", "Service Income", "Product Income", "Project Cost", "Marketing", "Transport", "Rent", "Other"].map(c => (
                    <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Amount (৳)</Label>
                <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Account</Label>
              <Select value={formData.accountId} onValueChange={v => setFormData({...formData, accountId: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Choose Account" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase">{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Notes</Label>
              <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Reference or detail..." className="h-12 bg-gray-50 border-none rounded-xl" />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl mt-4">
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Entry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

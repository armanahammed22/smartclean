
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, getDocs, where, writeBatch, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw, 
  Loader2, 
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Receipt,
  FileText,
  Search
} from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FinanceDashboardPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Finance Data (New Collections)
  const incomeQuery = useMemoFirebase(() => db ? query(collection(db, 'finance_income'), orderBy('date', 'desc')) : null, [db]);
  const expenseQuery = useMemoFirebase(() => db ? query(collection(db, 'finance_expenses'), orderBy('date', 'desc')) : null, [db]);
  
  const { data: incomeData, isLoading: iLoading } = useCollection(incomeQuery);
  const { data: expenseData, isLoading: eLoading } = useCollection(expenseQuery);

  // 2. Fetch Existing Data for Sync (Read Only)
  const bookingsQuery = useMemoFirebase(() => db ? query(collection(db, 'bookings'), where('status', '==', 'Completed')) : null, [db]);
  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders'), where('status', 'in', ['Delivered', 'Completed'])) : null, [db]);

  // 3. Auto-Sync Logic (Safe Implementation)
  const handleSync = async () => {
    if (!db) return;
    setIsSyncing(true);
    try {
      const bookingsSnap = await getDocs(bookingsQuery!);
      const ordersSnap = await getDocs(ordersQuery!);
      const existingIncomeSnap = await getDocs(collection(db, 'finance_income'));
      
      const existingRefIds = new Set(existingIncomeSnap.docs.map(d => d.data().referenceId));
      const batch = writeBatch(db);
      let newCount = 0;

      // Sync Bookings
      bookingsSnap.docs.forEach(d => {
        const data = d.data();
        if (!existingRefIds.has(d.id)) {
          const newDoc = doc(collection(db, 'finance_income'));
          batch.set(newDoc, {
            referenceId: d.id,
            source: 'booking',
            title: `Service: ${data.serviceTitle || 'General'}`,
            amount: data.totalPrice || 0,
            status: 'Paid',
            date: data.updatedAt || data.createdAt || new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
          newCount++;
        }
      });

      // Sync Orders
      ordersSnap.docs.forEach(d => {
        const data = d.data();
        if (!existingRefIds.has(d.id)) {
          const newDoc = doc(collection(db, 'finance_income'));
          batch.set(newDoc, {
            referenceId: d.id,
            source: 'order',
            title: `Order: #${d.id.slice(0,6).toUpperCase()}`,
            amount: data.totalPrice || 0,
            status: 'Paid',
            date: data.updatedAt || data.createdAt || new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
          newCount++;
        }
      });

      if (newCount > 0) {
        await batch.commit();
        toast({ title: "Sync Complete", description: `${newCount} new income records added.` });
      } else {
        toast({ title: "Already Up-to-date", description: "No new completed transactions found." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Calculations & Filtering
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (filterRange === 'today') startDate = startOfDay(now);
    if (filterRange === 'week') startDate = startOfWeek(now);
    if (filterRange === 'month') startDate = startOfMonth(now);

    const filterFn = (item: any) => {
      const itemDate = parseISO(item.date);
      const matchesDate = startDate ? isAfter(itemDate, startDate) : true;
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    };

    const income = incomeData?.filter(filterFn) || [];
    const expenses = expenseData?.filter(filterFn) || [];

    const totalInc = income.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalExp = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Combine for transaction list
    const combined = [
      ...income.map(i => ({ ...i, type: 'income' })),
      ...expenses.map(e => ({ ...e, type: 'expense' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { totalInc, totalExp, profit: totalInc - totalExp, transactions: combined };
  }, [incomeData, expenseData, filterRange, searchTerm]);

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Finance Terminal</h1>
          <p className="text-muted-foreground text-sm font-medium">Income, Expenses & Profit Tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="rounded-xl h-11 font-bold gap-2">
            {isSyncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Sync from Sales
          </Button>
          <AddManualEntry type="income" onAdd={() => {}} />
          <AddManualEntry type="expense" onAdd={() => {}} />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Income</p>
              <h3 className="text-2xl font-black text-emerald-600">৳{filteredData.totalInc.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><ArrowUpRight size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Expenses</p>
              <h3 className="text-2xl font-black text-rose-600">৳{filteredData.totalExp.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform"><ArrowDownRight size={24} /></div>
          </CardContent>
        </Card>
        <Card className={cn(
          "border-none shadow-xl rounded-3xl overflow-hidden group",
          filteredData.profit >= 0 ? "bg-primary text-white" : "bg-rose-600 text-white"
        )}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Net Profit</p>
              <h3 className="text-2xl font-black">৳{filteredData.profit.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><Wallet size={24} /></div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS & LIST */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
            {['today', 'week', 'month', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setFilterRange(range as any)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all",
                  filterRange === range ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b p-6">
            <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
              <Receipt size={18} className="text-primary" /> Transaction Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Description</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Type</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                  <TableHead className="text-right pr-8 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iLoading || eLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                ) : filteredData.transactions.length > 0 ? filteredData.transactions.map((t: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="text-xs font-bold text-gray-500">{format(new Date(t.date), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{t.title}</div>
                      {t.referenceId && <div className="text-[9px] font-mono text-muted-foreground uppercase">REF: {t.referenceId.slice(0,8)}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase px-2",
                        t.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("font-black text-sm", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === 'income' ? '+' : '-'}৳{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Badge variant="secondary" className="text-[8px] font-black uppercase bg-gray-100">{t.status || 'Settled'}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No transactions found for this period.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddManualEntry({ type, onAdd }: { type: 'income' | 'expense', onAdd: () => void }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    status: 'Paid'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    try {
      const coll = type === 'income' ? 'finance_income' : 'finance_expenses';
      await addDoc(collection(db, coll), {
        ...form,
        amount: parseFloat(form.amount) || 0,
        source: 'manual',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Entry Recorded", description: `New ${type} has been added.` });
      setOpen(false);
      setForm({ title: '', amount: '', category: 'Other', date: format(new Date(), 'yyyy-MM-dd'), notes: '', status: 'Paid' });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={type === 'income' ? 'default' : 'outline'} className={cn("rounded-xl h-11 font-bold gap-2", type === 'expense' && "border-rose-200 text-rose-600 hover:bg-rose-50")}>
          <Plus size={16} /> Add {type}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
        <header className={cn("p-8 text-white", type === 'income' ? "bg-emerald-600" : "bg-rose-600")}>
          <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={20} /> Manual {type} Entry
          </DialogTitle>
        </header>
        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1">Title / Description</Label>
            <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Amount (৳)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
            </div>
          </div>
          {type === 'expense' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Category</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {['Salary', 'Equipment', 'Transport', 'Marketing', 'Purchase', 'Rent', 'Other'].map(c => (
                    <SelectItem key={c} value={c} className="uppercase font-black text-[10px]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase ml-1">Payment Status</Label>
            <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
              <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Paid" className="uppercase font-black text-[10px]">Paid / Settled</SelectItem>
                <SelectItem value="Due" className="uppercase font-black text-[10px]">Due / Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isSaving} className={cn("w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl mt-4", type === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700")}>
            {isSaving ? <Loader2 className="animate-spin" /> : "Save Entry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

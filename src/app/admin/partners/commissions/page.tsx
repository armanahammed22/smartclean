'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  ArrowLeft, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PartnerCommissionsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const partnerIdFilter = searchParams.get('partnerId');
  
  const [searchTerm, setSearchTerm] = useState('');

  // Optimized to avoid index error: fetch all and filter in memory
  const ledgerQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'finance_ledger'), orderBy('date', 'desc'));
  }, [db, user]);

  const partnersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'partners') : null, [db, user]);

  const { data: allLedger, isLoading } = useCollection(ledgerQuery);
  const { data: partners } = useCollection(partnersQuery);

  const ledger = useMemo(() => {
    return allLedger?.filter(l => l.category === 'Partner Commission') || [];
  }, [allLedger]);

  const filtered = useMemo(() => {
    let list = ledger || [];
    if (partnerIdFilter) {
      list = list.filter(l => l.partnerId === partnerIdFilter);
    }
    if (searchTerm) {
      list = list.filter(l => 
        l.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partners?.find(p => p.id === l.partnerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [ledger, searchTerm, partnerIdFilter, partners]);

  const metrics = useMemo(() => {
    const income = filtered.filter(l => l.type === 'income' && l.paidStatus === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expense = filtered.filter(l => l.type === 'expense' && l.paidStatus === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const unpaid = filtered.filter(l => l.paidStatus === 'Unpaid').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    return { income, expense, balance: income - expense, unpaid };
  }, [filtered]);

  const togglePaidStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Paid' ? 'Unpaid' : 'Paid';
    await updateDoc(doc(db, 'finance_ledger', id), { paidStatus: next });
    toast({ title: "Settlement Status Updated" });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/partners"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Commission Ledger</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Audit & Settlements Feed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export Audit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Commission Income", val: metrics.income, icon: ArrowUpRight, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Commission Expense", val: metrics.expense, icon: ArrowDownRight, bg: "bg-rose-50", color: "text-rose-600" },
          { label: "Net Earnings", val: metrics.balance, icon: Wallet, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Pending Settlement", val: metrics.unpaid, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">৳{s.val.toLocaleString()}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by partner or memo..." 
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
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Partner & Account</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Transaction</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((item) => {
                const partner = partners?.find(p => p.id === item.partnerId);
                return (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="text-[10px] font-black text-gray-400 uppercase">{format(parseISO(item.date), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-50 text-gray-400 rounded-xl group-hover:text-primary transition-colors">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{partner?.name || 'Unknown Partner'}</div>
                          <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">SRC: #{item.sourceId?.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("font-black text-sm", item.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                        {item.type === 'income' ? '+' : '-'}৳{item.amount.toLocaleString()}
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">{item.type === 'income' ? 'Income Commission' : 'Expense Commission'}</p>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                        <MoreVertical size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No partner transactions recorded yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

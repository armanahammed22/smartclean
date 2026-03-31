
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Wallet, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  ArrowLeft, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Store,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function GlobalVendorCommissionsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Fixed Index Error: Fetch all and filter in memory
  const ledgerQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'finance_ledger'), orderBy('date', 'desc')) : null, [db]);
  const vendorsQuery = useMemoFirebase(() => db ? collection(db, 'vendor_profiles') : null, [db]);

  const { data: allLedger, isLoading: lLoading } = useCollection(ledgerQuery);
  const { data: allVendors } = useCollection(vendorsQuery);

  const vendorLedger = useMemo(() => {
    return allLedger?.filter(l => l.category === 'Vendor Commission' || l.partnerVendorId) || [];
  }, [allLedger]);

  const filtered = useMemo(() => {
    return vendorLedger.filter(item => {
      const vendorName = allVendors?.find(v => v.id === item.partnerVendorId)?.shopName || '';
      return vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [vendorLedger, searchTerm, allVendors]);

  const metrics = useMemo(() => {
    const totalDue = filtered.filter(l => l.paidStatus === 'Unpaid').reduce((a,c) => a + c.amount, 0);
    const totalPaid = filtered.filter(l => l.paidStatus === 'Paid').reduce((a,c) => a + c.amount, 0);
    return { totalDue, totalPaid, count: filtered.length };
  }, [filtered]);

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Paid' ? 'Unpaid' : 'Paid';
    await updateDoc(doc(db, 'finance_ledger', id), { paidStatus: next });
    toast({ title: "Settlement Updated" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border h-10 w-10">
            <Link href="/admin/vendors"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Vendor Commissions</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Earnings Audit & Settlement Hub</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export Audit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-rose-50 text-rose-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Outstanding</p>
              <h3 className="text-3xl font-black">৳{metrics.totalDue.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-rose-600 group-hover:scale-110 transition-transform"><Clock size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Settled Earnings</p>
              <h3 className="text-3xl font-black">৳{metrics.totalPaid.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150 group-hover:scale-125 transition-transform"><Wallet size={100} /></div>
          <CardContent className="p-6 flex items-center justify-between h-full relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Global Volume</p>
              <h3 className="text-3xl font-black">{metrics.count} Txns</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px]">LIVE DATA</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by vendor shop name or memo..." 
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
                <TableHead className="pl-8 py-5 font-bold uppercase text-[9px] tracking-widest">Timeline</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Vendor Shop</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Amount</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest text-center">Settlement</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lLoading ? <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow> : filtered.map((entry) => {
                const vendor = allVendors?.find(v => v.id === entry.partnerVendorId);
                return (
                  <TableRow key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="text-[10px] font-bold text-gray-400">{format(parseISO(entry.date), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 text-primary rounded-xl"><Store size={16}/></div>
                        <div>
                          <p className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{vendor?.shopName || 'Unknown Vendor'}</p>
                          <p className="text-[9px] text-muted-foreground font-mono">Txn: #{entry.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-rose-600 text-sm">৳{entry.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleStatus(entry.id, entry.paidStatus)}>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase border-none px-2.5 py-1 rounded-full",
                          entry.paidStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {entry.paidStatus}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100" asChild>
                        <Link href={`/admin/vendors/${entry.partnerVendorId}`}><ArrowUpRight size={16}/></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && !lLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No vendor commission records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

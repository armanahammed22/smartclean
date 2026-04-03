'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  Clock,
  Briefcase,
  Zap,
  MoreVertical,
  Maximize
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized Fetching
  const projectsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'partner_projects'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const partnersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'partners') : null, [db, user]);

  const { data: projects, isLoading: pLoading } = useCollection(projectsQuery);
  const { data: partners, isLoading: prLoading } = useCollection(partnersQuery);

  const filtered = useMemo(() => {
    let list = projects || [];
    if (partnerIdFilter) {
      list = list.filter(p => p.partnerId === partnerIdFilter);
    }
    if (searchTerm) {
      list = list.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.partnerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [projects, searchTerm, partnerIdFilter]);

  const metrics = useMemo(() => {
    const totalVolume = filtered.reduce((a, c) => a + (c.projectAmount || 0), 0);
    const totalComm = filtered.reduce((a, c) => a + (c.commissionAmount || 0), 0);
    return { totalVolume, totalComm, count: filtered.length };
  }, [filtered]);

  const togglePaidStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Paid' ? 'Unpaid' : 'Paid';
    await updateDoc(doc(db, 'partner_projects', id), { paidStatus: next });
    toast({ title: "Settlement Updated" });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border h-10 w-10" asChild>
            <Link href="/admin/partners"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Partner Portfolio</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">B2B Commission Logic & History</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11 border-gray-200 gap-2"><Download size={16} /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: "Partner Gross Volume", val: metrics.totalVolume, icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Accumulated Commissions", val: metrics.totalComm, icon: Wallet, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Active Project Count", val: metrics.count, icon: Zap, bg: "bg-amber-50", color: "text-amber-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-2xl font-black text-gray-900">৳{s.val.toLocaleString()}</h3>
              </div>
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={24} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by project name or company..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      {/* 🚀 MAIN DATA TABLE */}
      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] border border-gray-100">
        <CardHeader className="bg-gray-50/50 border-b p-8">
          <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
            <Building2 size={18} className="text-primary" /> Active B2B Commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[9px] tracking-widest">Project Identity</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Partner Company</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Total Value</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Comm %</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Comm Amount</TableHead>
                <TableHead className="text-center font-bold uppercase text-[9px] tracking-widest">Settlement</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pLoading || prLoading) ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[180px]">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground font-bold">{format(parseISO(item.createdAt), 'MMM dd, yyyy')}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-none px-2 py-0.5 text-[10px] font-black uppercase">{item.partnerName}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs">৳{item.projectAmount?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-black text-gray-400">{item.commissionRate}%</TableCell>
                  <TableCell className="font-black text-sm text-indigo-600">৳{item.commissionAmount?.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => togglePaidStatus(item.id, item.paidStatus)}>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase border-none px-3 py-1 rounded-full",
                        item.paidStatus === 'Paid' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {item.paidStatus}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all" asChild>
                      <Link href={`/admin/partners/projects`}><MoreVertical size={16} /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !pLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-24 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No collaboration records found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

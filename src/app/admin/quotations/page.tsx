
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Eye, 
  Loader2, 
  Filter, 
  Plus, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  TrendingUp,
  History,
  FileDown,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Banknote,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function QuotationsListPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const quotesQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'quotations'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: quotations, isLoading } = useCollection(quotesQuery);

  const stats = useMemo(() => {
    if (!quotations) return { total: 0, pending: 0, approved: 0, converted: 0 };
    return {
      total: quotations.length,
      pending: quotations.filter(q => q.status === 'Sent' || q.status === 'Draft').length,
      approved: quotations.filter(q => q.status === 'Approved').length,
      converted: quotations.filter(q => q.status === 'Converted').length
    };
  }, [quotations]);

  const filtered = quotations?.filter(q => 
    q.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this quotation?")) return;
    try {
      await deleteDoc(doc(db, 'quotations', id));
      toast({ title: "Quotation Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const handleDuplicate = async (quote: any) => {
    if (!db) return;
    try {
      const { id, quoteNumber, createdAt, updatedAt, ...rest } = quote;
      await addDoc(collection(db, 'quotations'), {
        ...rest,
        quoteNumber: quoteNumber + '-COPY',
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Quotation Duplicated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Duplicate Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Quotation Manager</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage professional service estimates and funnel conversions</p>
        </div>
        <Button asChild className="rounded-xl font-black h-12 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
          <Link href="/admin/quotations/new"><Plus size={18} /> New Quotation</Link>
        </Button>
      </div>

      {/* 📊 KPI DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Estimates", val: stats.total, icon: FileSpreadsheet, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Pending Review", val: stats.pending, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Client Approved", val: stats.approved, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Converted Sales", val: stats.converted, icon: TrendingUp, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{s.label}</p>
                <h3 className="text-2xl font-black text-[#081621]">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner", s.bg, s.color)}><s.icon size={22} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary" size={20} />
          <Input 
            placeholder="Search by quote number or client name..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-2xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem] border border-gray-100">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow className="border-none">
                <TableHead className="font-black py-6 pl-10 uppercase text-[10px] tracking-widest text-[#081621]">Quote Ref</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Recipient</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Value</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                <TableHead className="text-right pr-10 uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
              ) : filtered?.length ? (
                filtered.map((quote) => (
                  <TableRow key={quote.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-6 pl-10">
                      <div className="font-black text-gray-900 text-xs font-mono uppercase tracking-tighter">{quote.quoteNumber}</div>
                      <div className="text-[9px] text-muted-foreground font-bold mt-1.5 uppercase">Issued: {format(new Date(quote.issueDate), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[150px] leading-tight mb-1">{quote.customerInfo.name}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{quote.customerInfo.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-black text-sm text-[#081621]">৳{quote.total?.toLocaleString()}</div>
                       <div className="text-[9px] text-muted-foreground font-bold uppercase">{quote.items?.length || 0} Components</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg",
                        quote.status === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                        quote.status === 'Sent' ? "bg-blue-50 text-blue-700" :
                        quote.status === 'Draft' ? "bg-gray-100 text-gray-500" :
                        quote.status === 'Rejected' ? "bg-red-50 text-red-700" :
                        quote.status === 'Converted' ? "bg-indigo-50 text-indigo-700" :
                        "bg-rose-50 text-rose-700"
                      )}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl" asChild>
                          <Link href={`/admin/quotations/${quote.id}`}><Edit size={16} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 hover:bg-indigo-50 rounded-xl" onClick={() => handleDuplicate(quote)}>
                          <Copy size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(quote.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No Quotations matching search found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

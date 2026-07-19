'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Eye, 
  Edit,
  Loader2, 
  Plus, 
  Zap, 
  CheckCircle2, 
  Clock, 
  MessageCircle,
  Share2,
  Download,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    if (!db || !confirm("Delete this quotation permanently?")) return;
    try {
      await deleteDoc(doc(db, 'quotations', id));
      toast({ title: "Quotation Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting" });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'quotations', id), { status, updatedAt: new Date().toISOString() });
    toast({ title: "Status Updated" });
  };

  const handleWhatsApp = (quote: any) => {
    const phone = quote.customerInfo?.phone;
    if (!phone) {
      toast({ variant: "destructive", title: "Missing Phone", description: "Customer phone number is required for WhatsApp share." });
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartclean.com.bd';
    const text = `আসসালামু আলাইকুম, স্মার্ট ক্লিন থেকে আপনার কোটিশনটি (${quote.quoteNumber}) পাঠানো হলো। এখানে দেখুন: ${baseUrl}/quotation/${quote.quoteNumber}`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = (quote: any) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://smartclean.com.bd';
    const link = `${baseUrl}/quotation/${quote.quoteNumber}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied", description: "Quotation URL saved to clipboard." });
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
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110 shadow-inner", s.bg, s.color)}><s.icon size={22} /></div>
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
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem] border border-gray-100">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="font-black py-6 pl-10 uppercase text-[10px] tracking-widest text-[#081621]">Quote Ref</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Recipient</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Value</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center text-[#081621]">Status</TableHead>
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
                      <div className="text-[9px] text-muted-foreground font-bold mt-1.5 uppercase">Issued: {quote.issueDate ? format(new Date(quote.issueDate), 'MMM dd, yyyy') : 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[150px] leading-tight mb-1">{quote.customerInfo?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{quote.customerInfo?.phone || 'No Phone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-black text-sm text-[#081621]">৳{quote.total?.toLocaleString()}</div>
                       <div className="text-[9px] text-muted-foreground font-bold uppercase">{quote.items?.length || 0} Components</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select defaultValue={quote.status} onValueChange={(v) => handleUpdateStatus(quote.id, v)}>
                        <SelectTrigger className={cn(
                          "h-8 text-[8px] font-black uppercase border-none px-2 rounded-lg w-[110px] mx-auto",
                          quote.status === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                          quote.status === 'Sent' ? "bg-blue-50 text-blue-700" :
                          quote.status === 'Draft' ? "bg-gray-100 text-gray-500" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {['Draft', 'Sent', 'Approved', 'Rejected', 'Expired'].map(s => <SelectItem key={s} value={s} className="text-[10px] font-black uppercase">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 bg-blue-50 rounded-xl" asChild title="Edit Details">
                          <Link href={`/admin/quotations/${quote.id}`}><Edit size={16} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 bg-emerald-50 rounded-xl" asChild title="Public Portal">
                          <Link href={`/quotation/${quote.quoteNumber}`} target="_blank"><Eye size={16} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 bg-indigo-50 rounded-xl" onClick={() => handleWhatsApp(quote)} title="Share on WhatsApp">
                          <MessageCircle size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 bg-amber-50 rounded-xl" onClick={() => handleCopyLink(quote)} title="Copy Public Link">
                          <Share2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive bg-rose-50 rounded-xl" onClick={() => handleDelete(quote.id)} title="Delete Record">
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

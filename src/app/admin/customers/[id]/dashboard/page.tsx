
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Calendar, CreditCard, Share2, ArrowLeft, Clock, MapPin, Loader2, ShieldCheck, User, Banknote, History, ArrowUpRight, ArrowDownRight, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminCustomerDashboardView() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => (db && id) ? doc(db, 'users', id as string) : null, [db, id]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const invoicesQuery = useMemoFirebase(() => (db && id) ? query(collection(db, 'invoices'), where('customerId', '==', id), orderBy('createdAt', 'desc')) : null, [db, id]);
  const { data: invoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const stats = useMemo(() => {
    if (!invoices) return { volume: 0, paid: 0, due: 0, count: 0 };
    return {
      volume: invoices.reduce((a, c) => a + (c.total || 0), 0),
      paid: invoices.reduce((a, c) => a + (c.paidAmount || 0), 0),
      due: invoices.reduce((a, c) => a + (c.dueAmount || 0), 0),
      count: invoices.length
    };
  }, [invoices]);

  if (profileLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Customer Intelligence...</p>
    </div>
  );

  if (!profile) return <div className="p-20 text-center text-muted-foreground italic">Customer profile not found.</div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{profile.name}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <ShieldCheck className="text-primary" size={12} /> Secure Billing Insight
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("bg-emerald-50 text-emerald-700 border-none uppercase font-black text-[9px] h-6", profile.status === 'active' ? 'opacity-100' : 'grayscale opacity-50')}>
             Account Active
          </Badge>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID: {profile.uid.slice(0, 12)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Lifetime Billing", val: `৳${stats.volume.toLocaleString()}`, icon: Banknote, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Total Paid", val: `৳${stats.paid.toLocaleString()}`, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Outstanding Due", val: `৳${stats.due.toLocaleString()}`, icon: Wallet, bg: "bg-rose-50", color: "text-rose-600" },
          { label: "Affiliate Earnings", val: `৳${profile.totalEarnings || 0}`, icon: Share2, bg: "bg-purple-50", color: "text-purple-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className={cn("p-2.5 w-fit rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={22} /></div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight truncate">{s.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Recent Invoices */}
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b p-8 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Billing Ledger</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold text-gray-400 mt-1">Direct invoice records for this partner</CardDescription>
               </div>
               <Badge className="bg-primary text-white border-none font-black text-[9px]">{stats.count} INVOICES</Badge>
            </CardHeader>
            <CardContent className="p-0">
               {invoicesLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : (
                  <Table>
                    <TableHeader className="bg-gray-50/30">
                       <TableRow>
                          <TableHead className="pl-8 py-5 font-bold uppercase text-[9px] tracking-widest">Inv #</TableHead>
                          <TableHead className="font-bold uppercase text-[9px] tracking-widest">Date</TableHead>
                          <TableHead className="font-bold uppercase text-[9px] tracking-widest">Amount</TableHead>
                          <TableHead className="font-bold uppercase text-[9px] tracking-widest">Due</TableHead>
                          <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Status</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {invoices?.map(inv => (
                         <TableRow key={inv.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => router.push(`/admin/invoices/${inv.id}`)}>
                            <TableCell className="pl-8 py-4 font-mono font-black text-xs text-primary">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-[10px] font-bold text-gray-400">{format(new Date(inv.createdAt), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="font-black text-gray-900 text-sm">৳{inv.total?.toLocaleString()}</TableCell>
                            <TableCell className="font-black text-rose-500 text-sm">৳{inv.dueAmount?.toLocaleString()}</TableCell>
                            <TableCell className="text-right pr-8">
                               <Badge className={cn(
                                 "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                                 inv.paymentStatus === 'Paid' ? "bg-green-100 text-green-700" : 
                                 inv.paymentStatus === 'Partial' ? "bg-blue-100 text-blue-700" : 
                                 "bg-rose-100 text-rose-700"
                               )}>{inv.paymentStatus}</Badge>
                            </TableCell>
                         </TableRow>
                       ))}
                       {!invoices?.length && (
                         <TableRow><TableCell colSpan={5} className="py-20 text-center text-xs text-muted-foreground italic">No transaction history found.</TableCell></TableRow>
                       )}
                    </TableBody>
                  </Table>
               )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8 border border-gray-100 space-y-8">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/5 text-primary rounded-2xl"><MapPin size={24}/></div>
                <h4 className="text-base font-black uppercase tracking-tight text-gray-900">Contact Repository</h4>
             </div>
             <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Primary Address</p>
                   <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{profile.address || 'No address registered'}"</p>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-4 border-t">
                   <div className="flex items-center gap-3 text-xs font-bold text-gray-700"><Phone size={14} className="text-primary"/> {profile.phone || 'N/A'}</div>
                   <div className="flex items-center gap-3 text-xs font-bold text-gray-700"><Mail size={14} className="text-primary"/> {profile.email}</div>
                </div>
                <Button className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg" variant="outline" asChild>
                   <Link href={`/admin/customers?edit=${profile.id}`}>Update Profile Metadata</Link>
                </Button>
             </div>
          </Card>

          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} /></div>
            <CardHeader className="relative z-10 p-8 pb-4">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2"><Target size={18}/> Retention Analytics</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-8 pt-0 space-y-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                     <div className="flex justify-between text-[9px] font-black uppercase text-white/40"><span>Collection Quality</span><span>{stats.volume > 0 ? Math.round((stats.paid/stats.volume)*100) : 0}%</span></div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${stats.volume > 0 ? (stats.paid/stats.volume)*100 : 0}%` }} />
                     </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-bold text-white/60 leading-relaxed">
                        Customer has {stats.due > 0 ? 'outstanding dues' : 'settled all accounts'}. Recommended to {stats.due > 0 ? 'follow up before next service' : 'enroll in loyalty program'}.
                     </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

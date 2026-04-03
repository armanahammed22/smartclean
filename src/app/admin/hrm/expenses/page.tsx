'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  TrendingUp, 
  FileText,
  AlertCircle,
  Camera,
  History,
  Zap,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminExpenseClaimsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const claimsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'expense_claims'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: claims, isLoading } = useCollection(claimsQuery);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'expense_claims', id), { 
        status,
        updatedAt: new Date().toISOString()
      });
      toast({ title: `Claim ${status}`, description: `The transaction has been audited.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Audit Failed" });
    }
  };

  const stats = useMemo(() => {
    if (!claims) return { pending: 0, volume: 0 };
    return {
      pending: claims.filter(c => c.status === 'Pending').length,
      volume: claims.filter(c => c.status === 'Approved').reduce((acc, c) => acc + (c.amount || 0), 0)
    };
  }, [claims]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Expense Audit</h1>
          <p className="text-muted-foreground text-sm font-medium">Settle staff reimbursement and operational claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700 rounded-[2.5rem] border border-orange-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Pending Settlement</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats.pending} Claims</h3>
            </div>
            <div className="p-5 bg-white rounded-2xl shadow-sm"><AlertCircle size={32} /></div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700 rounded-[2.5rem] border border-blue-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-blue-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Total Disbursed</p>
              <h3 className="text-4xl font-black tracking-tighter">৳{stats.volume.toLocaleString()}</h3>
            </div>
            <div className="p-5 bg-white rounded-2xl shadow-sm"><Wallet size={32} /></div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={100} /></div>
          <CardContent className="p-8 flex items-center justify-between h-full relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Financial Audit</p>
              <h3 className="text-4xl font-black tracking-tighter italic">LOCKED</h3>
            </div>
            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">Secure</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Personnel</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Category & Details</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Amount</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Receipt</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : claims?.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xs text-gray-400 uppercase shadow-inner">{claim.staffName?.[0]}</div>
                      <div className="font-black text-gray-900 uppercase text-xs leading-none">{claim.staffName}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-700 uppercase tracking-tight">{claim.title}</div>
                      <div className="text-[9px] text-muted-foreground font-medium uppercase truncate max-w-[200px]">"{claim.description}"</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-gray-900 text-sm">৳{claim.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    {claim.imageUrl ? (
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-[9px] font-black uppercase gap-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl" asChild>
                        <a href={claim.imageUrl} target="_blank"><Camera size={14} /> View File</a>
                      </Button>
                    ) : <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">No Attachment</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm",
                      claim.status === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                      claim.status === 'Rejected' ? "bg-rose-50 text-rose-700" :
                      "bg-amber-50 text-amber-700"
                    )}>
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    {claim.status === 'Pending' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl" onClick={() => handleUpdateStatus(claim.id, 'Approved')}>
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl" onClick={() => handleUpdateStatus(claim.id, 'Rejected')}>
                          <XCircle size={18} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {claims?.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-32 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No active claims in the audit queue.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

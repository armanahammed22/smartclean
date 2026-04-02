
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Eye, 
  TrendingUp, 
  FileText,
  AlertCircle,
  Camera,
  Layers,
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
      toast({ title: `Claim ${status}`, description: `Request has been processed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
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
          <h1 className="text-2xl font-black text-gray-900 uppercase">Expense Audit</h1>
          <p className="text-muted-foreground text-sm font-medium">Verify and settle staff reimbursement claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Awaiting Verification</p>
              <h3 className="text-3xl font-black">{stats.pending} Claims</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm"><AlertCircle size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Total Reimbursed</p>
              <h3 className="text-3xl font-black">৳{stats.volume.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm"><Wallet size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><TrendingUp size={100} /></div>
          <CardContent className="p-6 flex items-center justify-between h-full relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Financial Integrity</p>
              <h3 className="text-3xl font-black italic">VERIFIED</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1">SECURE</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Personnel</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Claim Details</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Receipt</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : claims?.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">{claim.staffName?.[0]}</div>
                      <div className="font-black text-gray-900 uppercase text-xs leading-none">{claim.staffName || 'Staff'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-700 uppercase">{claim.title}</div>
                      <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight italic">"{claim.description}"</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-gray-900 text-sm">৳{claim.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    {claim.imageUrl ? (
                      <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase gap-1 text-primary" asChild>
                        <a href={claim.imageUrl} target="_blank"><Camera size={12} /> View File</a>
                      </Button>
                    ) : <span className="text-[9px] text-gray-300 font-bold uppercase">No Attachment</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2",
                      claim.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      claim.status === 'Approved' ? "bg-green-50 text-green-700" :
                      "bg-red-50 text-red-700"
                    )}>
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    {claim.status === 'Pending' && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => handleUpdateStatus(claim.id, 'Approved')}>
                          <CheckCircle2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleUpdateStatus(claim.id, 'Rejected')}>
                          <XCircle size={16} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {claims?.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">No active expense claims found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

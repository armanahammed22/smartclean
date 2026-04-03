'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Briefcase,
  AlertCircle,
  TrendingUp,
  History,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminLeavesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const leavesQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'leave_requests'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: requests, isLoading } = useCollection(leavesQuery);

  const handleUpdateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'leave_requests', id), { 
        status,
        updatedAt: new Date().toISOString()
      });
      toast({ title: `Leave ${status}`, description: `Request processed successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const stats = useMemo(() => {
    if (!requests) return { pending: 0, approved: 0 };
    return {
      pending: requests.filter(r => r.status === 'Pending').length,
      approved: requests.filter(r => r.status === 'Approved').length
    };
  }, [requests]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Verify and manage staff time-off requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700 rounded-[2.5rem] overflow-hidden border border-orange-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Awaiting Review</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats.pending} Requests</h3>
            </div>
            <div className="p-5 bg-white rounded-2xl shadow-sm"><AlertCircle size={32} /></div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-[2.5rem] overflow-hidden border border-emerald-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div>
              <p className="text-emerald-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Approved This Month</p>
              <h3 className="text-4xl font-black tracking-tighter">{stats.approved} Total</h3>
            </div>
            <div className="p-5 bg-white rounded-2xl shadow-sm"><CheckCircle2 size={32} /></div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><History size={100} /></div>
          <CardContent className="p-8 flex items-center justify-between h-full relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Resource Health</p>
              <h3 className="text-4xl font-black tracking-tighter">STABLE</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">Live</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Personnel</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Type</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Duration</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : requests?.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xs text-gray-400 uppercase shadow-inner">{req.staffName?.[0]}</div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{req.staffName}</div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight italic">"{req.reason}"</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                      {req.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-500 uppercase">
                    {req.startDate} <span className="mx-1 text-gray-300">→</span> {req.endDate}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm",
                      req.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      req.status === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                      "bg-rose-50 text-rose-700"
                    )}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    {req.status === 'Pending' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl" onClick={() => handleUpdateStatus(req.id, 'Approved')}>
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl" onClick={() => handleUpdateStatus(req.id, 'Rejected')}>
                          <XCircle size={18} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests?.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-32 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Queue Clear. No leave requests found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

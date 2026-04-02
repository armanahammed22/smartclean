
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
  User, 
  Briefcase,
  AlertCircle,
  TrendingUp,
  ArrowRight
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
      toast({ title: `Leave ${status}`, description: `Request has been marked as ${status}.` });
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
          <h1 className="text-2xl font-black text-gray-900 uppercase">Leave Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Review and verify staff leave applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Awaiting Review</p>
              <h3 className="text-3xl font-black">{stats.pending} Requests</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm"><AlertCircle size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700 rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-emerald-700/80 text-[10px] font-black uppercase tracking-widest mb-1">Approved Monthly</p>
              <h3 className="text-3xl font-black">{stats.approved} Total</h3>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm"><CheckCircle2 size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><TrendingUp size={100} /></div>
          <CardContent className="p-6 flex items-center justify-between h-full relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Resource Health</p>
              <h3 className="text-3xl font-black italic">OPTIMAL</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1">REAL-TIME</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Personnel</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Type</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Duration</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : requests?.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">{req.staffName?.[0]}</div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{req.staffName || 'Technician'}</div>
                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight italic">"{req.reason}"</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 border-primary/20 text-primary">
                      {req.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-500 uppercase">
                    {req.startDate} <span className="mx-1 text-gray-300">→</span> {req.endDate}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2",
                      req.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      req.status === 'Approved' ? "bg-green-50 text-green-700" :
                      "bg-red-50 text-red-700"
                    )}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    {req.status === 'Pending' && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-xl" onClick={() => handleUpdateStatus(req.id, 'Approved')}>
                          <CheckCircle2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-xl" onClick={() => handleUpdateStatus(req.id, 'Rejected')}>
                          <XCircle size={16} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests?.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">No leave requests in the queue.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

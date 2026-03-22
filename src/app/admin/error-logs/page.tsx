'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShieldAlert, 
  Search, 
  Loader2, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  ChevronRight,
  Clock,
  Layout,
  User,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ErrorLogsPage() {
  const db = useFirestore();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Real-time error logs query
  const logsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'error_logs'), orderBy('createdAt', 'desc'), limit(100));
  }, [db]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.message?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.page?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleResolve = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'error_logs', id), { status: 'resolved' });
      toast({ title: t('status_resolved') });
      setSelectedLog(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently delete this log?")) return;
    try {
      await deleteDoc(doc(db, 'error_logs', id));
      toast({ title: "Log Deleted" });
      setSelectedLog(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return <Badge className="bg-red-600 text-white border-none uppercase text-[8px] font-black">{t('severity_critical')}</Badge>;
      case 'medium': return <Badge className="bg-orange-500 text-white border-none uppercase text-[8px] font-black">{t('severity_medium')}</Badge>;
      default: return <Badge className="bg-gray-400 text-white border-none uppercase text-[8px] font-black">{t('severity_low')}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') return <Badge className="bg-green-100 text-green-700 border-none uppercase text-[8px] font-black">{t('status_resolved')}</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-none uppercase text-[8px] font-black animate-pulse">{t('status_pending')}</Badge>;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{t('item_error_logs')}</h1>
          <p className="text-muted-foreground text-sm font-medium">Global system health monitoring and crash reports</p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="bg-white px-4 py-2 rounded-xl shadow-sm border text-primary font-black uppercase text-[10px] tracking-widest gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" /> Live Sync Active
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-red-50 text-red-700 rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-red-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Critical Issues</p>
              <h3 className="text-3xl font-black">{logs?.filter(l => l.severity === 'critical' && l.status === 'pending').length || 0}</h3>
            </div>
            <ShieldAlert size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl border-l-4 border-l-orange-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none mb-1">Pending Total</p>
              <h3 className="text-3xl font-black text-gray-900">{logs?.filter(l => l.status === 'pending').length || 0}</h3>
            </div>
            <Clock size={40} className="text-orange-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Avg Resolution</p>
              <h3 className="text-3xl font-black">1.2h</h3>
            </div>
            <CheckCircle2 size={40} className="text-primary opacity-20" />
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder={t('search_errors')}
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full md:w-[140px] bg-gray-50 border-none rounded-xl font-bold text-xs uppercase">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUS</SelectItem>
              <SelectItem value="pending">PENDING</SelectItem>
              <SelectItem value="resolved">RESOLVED</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-12 w-full md:w-[140px] bg-gray-50 border-none rounded-xl font-bold text-xs uppercase">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL SEVERITY</SelectItem>
              <SelectItem value="critical">CRITICAL</SelectItem>
              <SelectItem value="medium">MEDIUM</SelectItem>
              <SelectItem value="low">LOW</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Error Event</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Context</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Timing</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-24"><Loader2 className="animate-spin text-primary inline" size={32} /></TableCell></TableRow>
              ) : filteredLogs?.length ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg mt-0.5",
                          log.severity === 'critical' ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
                        )}>
                          <AlertTriangle size={16} />
                        </div>
                        <div className="max-w-[300px]">
                          <div className="font-black text-gray-900 uppercase text-[11px] leading-tight line-clamp-1 mb-1">{log.message}</div>
                          <div className="text-[9px] text-muted-foreground font-mono truncate">{log.page}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase"><User size={10} /> {log.role}</div>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-medium">{log.userId?.slice(0, 12)}...</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-gray-400">
                      {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getSeverityBadge(log.severity)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {log.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={(e) => { e.stopPropagation(); handleResolve(log.id); }}>
                            <CheckCircle2 size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-32 italic text-muted-foreground font-medium">No error logs recorded matching your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className={cn(
            "p-8 text-white",
            selectedLog?.severity === 'critical' ? "bg-red-600" : "bg-[#081621]"
          )}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  {getSeverityBadge(selectedLog?.severity)}
                  {getStatusBadge(selectedLog?.status)}
                </div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-tight max-w-[500px]">
                  {selectedLog?.message}
                </DialogTitle>
              </div>
              <ShieldAlert size={48} className="opacity-20" />
            </div>
          </DialogHeader>
          <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <Layout size={12} /> Route Context
                </h4>
                <div className="p-4 bg-gray-50 rounded-2xl font-mono text-[10px] break-all leading-relaxed border">
                  {selectedLog?.page}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                  <User size={12} /> User Context
                </h4>
                <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border">
                  <p className="text-[10px] font-bold">Role: <span className="uppercase text-primary">{selectedLog?.role}</span></p>
                  <p className="text-[10px] font-bold">UID: <span className="font-mono text-gray-500">{selectedLog?.userId}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                <Info size={12} /> Stack Trace
              </h4>
              <div className="p-6 bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                <pre className="font-mono text-[9px] text-blue-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[300px] custom-scrollbar">
                  {selectedLog?.stack}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 border-t flex justify-between items-center sm:justify-between">
            <Button variant="outline" className="rounded-xl font-bold text-xs" onClick={() => setSelectedLog(null)}>Close View</Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="text-destructive font-black uppercase text-[10px] rounded-xl hover:bg-red-50" onClick={() => handleDelete(selectedLog?.id)}>
                <Trash2 size={14} className="mr-2" /> Delete Log
              </Button>
              {selectedLog?.status === 'pending' && (
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-green-600/20" onClick={() => handleResolve(selectedLog?.id)}>
                  <CheckCircle2 size={14} className="mr-2" /> {t('mark_resolved')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

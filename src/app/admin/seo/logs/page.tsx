'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Loader2, 
  Globe, 
  MousePointer2,
  ShieldCheck,
  Zap,
  Info,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MarketingLogsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const logsQuery = useMemoFirebase(() => db ? query(collection(db, 'tracking_logs'), orderBy('timestamp', 'desc'), limit(100)) : null, [db]);
  const { data: logs, isLoading } = useCollection(logsQuery);

  const filtered = logs?.filter(l => 
    l.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.eventId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Event Tracking Logs</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time attribution feed for Facebook and Google events</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by event name or unique ID..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] border border-gray-100">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-none">
                  <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest text-[#081621]">Event Identity</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Platform</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Method</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-[#081621]">Timing</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center text-[#081621]">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest text-[#081621]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filtered?.length ? (
                  filtered.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-5 pl-8">
                        <div>
                          <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{log.eventName}</div>
                          <div className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]">{log.eventId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shadow-sm"><Zap size={12} fill="currentColor" /></div>
                          <span className="text-[10px] font-black uppercase text-gray-600">{log.platform || 'Facebook'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {log.method === 'Server' ? <Globe size={14} className="text-indigo-500" /> : <MousePointer2 size={14} className="text-primary" />}
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{log.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-gray-400">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn(
                          "text-[8px] font-black uppercase border-none px-2.5 py-1 rounded-lg shadow-sm",
                          log.status === 'Success' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedLog(log)}>
                          <Info size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No tracking events found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[85vh]">
          <DialogHeader className="p-8 bg-[#081621] text-white shrink-0 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <ShieldCheck className="text-primary" /> Payload Inspection
              </DialogTitle>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Protocol: Meta Conversion API (CAPI)</p>
            </div>
            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/30">
            <div className="space-y-4">
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <p className="text-[10px] font-black uppercase text-primary mb-4 flex items-center gap-2 border-b pb-2">
                  <Globe size={12}/> API Response from Meta
                </p>
                <pre className="font-mono text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar p-2 bg-gray-50 rounded-xl">
                  {JSON.stringify(selectedLog?.metaResponse, null, 2)}
                </pre>
              </div>
              
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <p className="text-[10px] font-black uppercase text-indigo-600 mb-4 flex items-center gap-2 border-b pb-2">
                  <FileText size={12}/> Original Request Payload
                </p>
                <pre className="font-mono text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar p-2 bg-gray-50 rounded-xl">
                  {JSON.stringify(selectedLog?.requestPayload || selectedLog?.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end">
            <Button onClick={() => setSelectedLog(null)} className="rounded-xl font-black px-8">Close Inspector</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

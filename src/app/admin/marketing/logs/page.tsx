
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
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
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
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Event Attribution Logs</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time tracking feed for Browser and Server events</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by event name or unique ID..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Event Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Platform</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Method</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Timing</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div>
                      <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{log.eventName}</div>
                      <div className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">{log.eventId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Zap size={12} fill="currentColor" /></div>
                      <span className="text-[10px] font-black uppercase text-gray-600">{log.platform}</span>
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
                      "text-[8px] font-black uppercase border-none px-2 py-0.5",
                      log.status === 'Success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSelectedLog(log)}>
                      <Info size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered?.length && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">No tracking events recorded in the last 100 entries.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-primary" /> Payload Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 bg-gray-50">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <pre className="font-mono text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar">
                {JSON.stringify(selectedLog?.payload, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  User,
  ArrowRight,
  Zap,
  Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminAttendancePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateRange] = useState(format(new Date(), 'yyyy-MM-dd'));

  const attendanceQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'attendance_logs'), orderBy('date', 'desc')) : null, [db, user]);
  const { data: logs, isLoading } = useCollection(attendanceQuery);

  const filteredLogs = useMemo(() => {
    return logs?.filter(log => {
      const nameMatch = log.staffName?.toLowerCase().includes(searchTerm.toLowerCase());
      const dateMatch = !dateFilter || log.date === dateFilter;
      return nameMatch && dateMatch;
    }) || [];
  }, [logs, searchTerm, dateFilter]);

  const stats = useMemo(() => {
    const today = logs?.filter(l => l.date === format(new Date(), 'yyyy-MM-dd')) || [];
    return {
      present: today.length,
      late: today.filter(l => {
        if (!l.checkIn) return false;
        const hour = new Date(l.checkIn).getHours();
        return hour >= 9; // Late if after 9 AM
      }).length
    };
  }, [logs]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Attendance Control</h1>
          <p className="text-muted-foreground text-sm font-medium">GPS-verified field presence monitoring</p>
        </div>
        <Button variant="outline" className="rounded-xl h-11 border-gray-200 gap-2 font-bold uppercase text-[10px] tracking-widest bg-white">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Today's Present</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.present} Staff</h3>
            </div>
            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Late Arrivals</p>
              <h3 className="text-4xl font-black text-amber-600 tracking-tighter">{stats.late} Staff</h3>
            </div>
            <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Clock size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={100} /></div>
          <CardContent className="p-8 flex items-center justify-between h-full relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">System Health</p>
              <h3 className="text-4xl font-black tracking-tighter">OPTIMAL</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1 rounded-lg">VERIFIED</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search staff name..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-56">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
          <Input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateRange(e.target.value)}
            className="pl-11 h-12 border-none bg-gray-50 rounded-2xl font-black uppercase text-[10px] tracking-widest"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Personnel</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Date</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Check In</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Check Out</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-6 pl-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xs text-gray-400 uppercase shadow-inner">{log.staffName?.[0]}</div>
                      <div className="font-black text-gray-900 uppercase text-xs tracking-tight">{log.staffName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-500 uppercase">{format(parseISO(log.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-black text-gray-900 text-xs">
                    {log.checkIn ? format(new Date(log.checkIn), 'hh:mm a') : '--:--'}
                  </TableCell>
                  <TableCell className="font-black text-gray-900 text-xs">
                    {log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : 'On Duty'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm",
                      log.status === 'Present' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    {log.locationIn && (
                      <Button variant="ghost" size="sm" className="h-9 px-4 text-[9px] font-black uppercase gap-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl" asChild>
                        <a href={`https://www.google.com/maps?q=${log.locationIn.lat},${log.locationIn.lng}`} target="_blank">
                          <MapPin size={12} /> View Map
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-32 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Empty Registry. Data sync pending.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

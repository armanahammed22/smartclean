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
  Zap
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
          <h1 className="text-2xl font-black text-gray-900 uppercase">Attendance Registry</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time GPS-verified field presence logs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Today's Present</p>
              <h3 className="text-3xl font-black text-gray-900">{stats.present} Staff</h3>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Late Arrivals</p>
              <h3 className="text-3xl font-black text-amber-600">{stats.late} Today</h3>
            </div>
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Compliance</p>
              <h3 className="text-3xl font-black">98.4%</h3>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl text-primary"><Zap size={24} fill="currentColor" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search staff name..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
          <Input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateRange(e.target.value)}
            className="pl-11 h-12 border-none bg-gray-50 rounded-xl font-bold text-xs"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Personnel</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Check In</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Check Out</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">{log.staffName?.[0]}</div>
                      <div className="font-black text-gray-900 uppercase text-xs">{log.staffName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-500 uppercase">{format(parseISO(log.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-black text-gray-900 text-xs">
                    {log.checkIn ? format(new Date(log.checkIn), 'hh:mm a') : '--:--'}
                  </TableCell>
                  <TableCell className="font-black text-gray-900 text-xs">
                    {log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : 'In Progress'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2",
                      log.status === 'Present' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    {log.locationIn && (
                      <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase gap-1 text-primary" asChild>
                        <a href={`https://www.google.com/maps?q=${log.locationIn.lat},${log.locationIn.lng}`} target="_blank">
                          <MapPin size={12} /> View Map
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">No attendance logs found for this criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

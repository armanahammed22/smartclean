'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  XCircle, 
  Calendar,
  User,
  Zap,
  Download,
  AlertCircle,
  History,
  ClipboardCheck,
  ChevronRight,
  MoreVertical,
  X
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminAttendanceManagementPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('manage');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // 1. Fetch Staff List
  const staffQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db]);
  const { data: staffList, isLoading: sLoading } = useCollection(staffQuery);

  // 2. Fetch Attendance Logs for filtering/history
  const logsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'attendance_logs'), orderBy('date', 'desc')) : null, [db, user]);
  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);

  // Filter logs for the selected date to show in "Manage" tab
  const todaysLogs = useMemo(() => {
    return logs?.filter(l => l.date === selectedDate) || [];
  }, [logs, selectedDate]);

  // Handle Mark Attendance
  const markAttendance = async (staff: any, status: string) => {
    if (!db) return;
    const logId = `${staff.id}_${selectedDate}`;
    setIsProcessing(logId);

    const payload = {
      staffId: staff.id,
      staffName: staff.name,
      date: selectedDate,
      status: status,
      updatedAt: serverTimestamp(),
      markedBy: 'Admin'
    };

    try {
      await setDoc(doc(db, 'attendance_logs', logId), payload, { merge: true });
      toast({ title: `Marked ${status}`, description: `${staff.name} is now ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const nameMatch = log.staffName?.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || log.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [logs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const today = logs?.filter(l => l.date === format(new Date(), 'yyyy-MM-dd')) || [];
    return {
      present: today.filter(l => l.status === 'Present').length,
      absent: today.filter(l => l.status === 'Absent').length,
      late: today.filter(l => l.status === 'Late').length,
      leave: today.filter(l => l.status === 'Leave').length,
    };
  }, [logs]);

  const exportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ["Staff Name", "Date", "Check In", "Check Out", "Status", "Marked By"];
    const rows = filteredLogs.map(l => [
      l.staffName, 
      l.date, 
      l.checkIn ? format(new Date(l.checkIn), 'hh:mm a') : 'N/A',
      l.checkOut ? format(new Date(l.checkOut), 'hh:mm a') : 'N/A',
      l.status,
      l.markedBy || 'Staff'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `attendance_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Duty Control Hub</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <ClipboardCheck className="text-primary" size={16} /> Workforce Presence Management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV} className="rounded-xl h-11 border-gray-200 gap-2 font-black uppercase text-[10px] tracking-widest bg-white shadow-sm hover:bg-gray-50">
            <Download size={16} /> Export Records
          </Button>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Present Today", val: stats.present, icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Absent", val: stats.absent, icon: XCircle, bg: "bg-rose-50", color: "text-rose-600" },
          { label: "Late Arrival", val: stats.late, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "On Leave", val: stats.leave, icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md">
          <TabsTrigger value="manage" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap size={14} /> Mark Attendance
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <History size={14} /> All Logs
          </TabsTrigger>
        </TabsList>

        {/* 🟢 MANAGE TAB */}
        <TabsContent value="manage" className="space-y-6 mt-0">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-6 md:p-8 border-b flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Manual Intake Protocol</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Mark attendance for a specific date</CardDescription>
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-inner">
                <Calendar className="ml-3 mt-2 text-primary" size={16} />
                <Input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-none bg-transparent h-10 w-40 font-black uppercase text-[10px] tracking-widest focus-visible:ring-0"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow className="border-none">
                    <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest text-gray-400">Employee Profile</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-gray-400">Current Status</TableHead>
                    <TableHead className="text-right pr-8 font-black uppercase text-[10px] tracking-widest text-gray-400">One-Click Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                  ) : staffList?.map((staff) => {
                    const log = todaysLogs.find(l => l.staffId === staff.id);
                    const isBusy = isProcessing === `${staff.id}_${selectedDate}`;
                    
                    return (
                      <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">{staff.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{staff.name}</div>
                              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {staff.id.slice(0, 8)} • {staff.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log ? (
                            <Badge className={cn(
                              "text-[8px] font-black uppercase border-none px-2 py-0.5",
                              log.status === 'Present' ? "bg-emerald-100 text-emerald-700" :
                              log.status === 'Absent' ? "bg-rose-100 text-rose-700" :
                              log.status === 'Late' ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {log.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-black uppercase text-gray-300 border-gray-100">Unmarked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            {isBusy ? (
                              <Loader2 className="animate-spin text-primary mx-4" size={16} />
                            ) : (
                              ['Present', 'Absent', 'Late', 'Leave'].map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markAttendance(staff, status)}
                                  className={cn(
                                    "h-8 px-3 rounded-lg text-[9px] font-black uppercase border transition-all",
                                    log?.status === status ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                                  )}
                                >
                                  {status}
                                </Button>
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📜 LOGS TAB */}
        <TabsContent value="logs" className="space-y-6 mt-0">
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search logs by staff name..." 
                className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full md:w-48 bg-gray-50 border-none rounded-2xl font-black uppercase text-[10px] px-6">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
            <CardContent className="p-0 overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none">
                    <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Personnel</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Date</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Timing (In/Out)</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621] text-center">Status</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Geotag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                  ) : filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-6 pl-10">
                        <div className="font-black text-gray-900 uppercase text-xs leading-none">{log.staffName}</div>
                        <p className="text-[8px] font-black text-gray-400 mt-1 uppercase tracking-widest">Marked by: {log.markedBy || 'Self'}</p>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-gray-500 uppercase">{format(parseISO(log.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {log.checkIn ? format(new Date(log.checkIn), 'hh:mm a') : '--:--'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : 'On Duty'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase border-none px-3 py-1 rounded-lg",
                          log.status === 'Present' ? "bg-emerald-50 text-emerald-700" :
                          log.status === 'Absent' ? "bg-rose-50 text-rose-700" :
                          log.status === 'Late' ? "bg-amber-50 text-amber-700" :
                          "bg-blue-50 text-blue-700"
                        )}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        {log.locationIn ? (
                          <Button variant="ghost" size="sm" className="h-9 px-4 text-[9px] font-black uppercase gap-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl" asChild>
                            <a href={`https://www.google.com/maps?q=${log.locationIn.lat},${log.locationIn.lng}`} target="_blank">
                              <MapPin size={12} /> Map
                            </a>
                          </Button>
                        ) : <span className="text-[9px] text-gray-200 font-black uppercase">Offline</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

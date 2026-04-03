'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where, doc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Plus, 
  FileText, 
  Loader2, 
  Wallet, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Users,
  Briefcase,
  Zap,
  ArrowRight,
  Download,
  Calculator
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminPayrollPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Data Queries
  const staffQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db, user]);
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    const start = `${selectedMonth}-01`;
    return query(collection(db, 'attendance_logs'), where('date', '>=', start));
  }, [db, user, selectedMonth]);
  
  const earningsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'staff_earnings') : null, [db, user]);

  const { data: staffList, isLoading: sLoading } = useCollection(staffQuery);
  const { data: attendance, isLoading: aLoading } = useCollection(attendanceQuery);
  const { data: earnings } = useCollection(earningsQuery);

  const payrollData = useMemo(() => {
    if (!staffList) return [];

    return staffList.map(staff => {
      const myAttendance = attendance?.filter(a => a.staffId === staff.id && a.date.startsWith(selectedMonth)) || [];
      const myEarnings = earnings?.filter(e => e.staffId === staff.id && e.createdAt.startsWith(selectedMonth)) || [];
      
      let basePay = 0;
      let commission = 0;
      let total = 0;

      if (staff.salaryModel === 'daily') {
        basePay = myAttendance.length * (staff.baseRate || 0);
      } else if (staff.salaryModel === 'monthly') {
        basePay = staff.baseRate || 0;
      } else if (staff.salaryModel === 'hybrid') {
        basePay = staff.baseRate || 0;
        commission = myEarnings.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      }

      total = basePay + commission;

      return {
        ...staff,
        workedDays: myAttendance.length,
        basePay,
        commission,
        totalPay: total
      };
    });
  }, [staffList, attendance, earnings, selectedMonth]);

  const totalMonthlyPayout = payrollData.reduce((acc, curr) => acc + curr.totalPay, 0);

  const handleProcessPayroll = async () => {
    if (!db) return;
    toast({ title: "Processing Payroll", description: "Calculating and generating disbursement records..." });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Payroll Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Unified salary model and distribution terminal</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-1 flex">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-10 border-none bg-transparent text-[10px] font-black uppercase w-36" />
          </div>
          <Button onClick={handleProcessPayroll} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-3 uppercase text-xs tracking-widest bg-primary">
            <Calculator size={18} /> Generate Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monthly Disbursement</p>
              <h3 className="text-4xl font-black text-primary tracking-tighter">৳{totalMonthlyPayout.toLocaleString()}</h3>
            </div>
            <div className="p-5 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <DollarSign size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Payees</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{staffList?.length || 0} Staff</h3>
            </div>
            <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Users size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={100} /></div>
          <CardContent className="p-8 flex items-center justify-between h-full relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Treasury Status</p>
              <h3 className="text-4xl font-black tracking-tighter italic">FUNDED</h3>
            </div>
            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">Automated</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Employee</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Model</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Days/Duty</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Base Pay</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Comm. (৳)</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Net Payable</TableHead>
                <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sLoading || aLoading) ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : payrollData.map((data) => (
                <TableRow key={data.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-6 pl-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400 uppercase shadow-inner">{data.name?.[0]}</div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{data.name}</div>
                        <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{data.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-3 py-1 bg-white border-primary/20 text-primary rounded-lg shadow-sm">
                      {data.salaryModel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-600 uppercase tracking-tighter">{data.workedDays} Days</TableCell>
                  <TableCell className="text-xs font-black text-gray-900">৳{data.basePay?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-black text-emerald-600">৳{data.commission?.toLocaleString()}</TableCell>
                  <TableCell className="font-black text-primary text-sm tracking-tight">৳{data.totalPay?.toLocaleString()}</TableCell>
                  <TableCell className="text-right pr-10">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <FileText size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {payrollData.length === 0 && !sLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-32 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">No payroll data calculated for this period.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

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
  ArrowRight
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

  const handleGeneratePayroll = async () => {
    if (!db) return;
    toast({ title: "Generating Payroll", description: "Calculating all staff salaries for the selected period..." });
    // In a real app, this would create a batch of payroll documents
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase">Payroll Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Multi-model salary calculation and disbursement terminal</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border rounded-xl p-1 flex">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="h-9 border-none bg-transparent text-[10px] font-black uppercase w-32" />
          </div>
          <Button onClick={handleGeneratePayroll} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
            <Zap size={18} fill="currentColor" /> Process Payroll
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Monthly Disbursement</p>
              <h3 className="text-3xl font-black text-primary">৳{totalMonthlyPayout.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:rotate-12 transition-transform"><DollarSign size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Payrolls</p>
              <h3 className="text-3xl font-black text-gray-900">{staffList?.length || 0} Staff</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><TrendingUp size={100} /></div>
          <CardContent className="p-6 flex items-center justify-between h-full relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Payroll Status</p>
              <h3 className="text-3xl font-black italic">HEALTHY</h3>
            </div>
            <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 py-1">AUTOMATED</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[10px] tracking-widest">Employee</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Model</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Days/Work</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Base Pay</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Commission</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Total Pay</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Payslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sLoading || aLoading) ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : payrollData.map((data) => (
                <TableRow key={data.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-black text-xs text-gray-400">{data.name?.[0]}</div>
                      <div>
                        <div className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{data.name}</div>
                        <div className="text-[9px] text-muted-foreground font-bold uppercase">{data.role}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 bg-white border-primary/20 text-primary">
                      {data.salaryModel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-600">{data.workedDays} Days</TableCell>
                  <TableCell className="text-xs font-bold text-gray-900">৳{data.basePay?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-black text-emerald-600">৳{data.commission?.toLocaleString()}</TableCell>
                  <TableCell className="font-black text-primary text-sm">৳{data.totalPay?.toLocaleString()}</TableCell>
                  <TableCell className="text-right pr-8">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileText size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

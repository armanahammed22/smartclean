
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  Calculator,
  Trash2,
  Edit,
  FileDown,
  X,
  Save,
  Check
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminPayrollPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dialog States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  // Data Queries
  const staffQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db, user]);
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    const start = `${selectedMonth}-01`;
    return query(collection(db, 'attendance_logs'), where('date', '>=', start));
  }, [db, user, selectedMonth]);
  
  const earningsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'staff_earnings') : null, [db, user]);
  
  // Finalized Payroll Records
  const payrollRecordsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'payroll_records'), where('month', '==', selectedMonth), orderBy('createdAt', 'desc')) : null, [db, user, selectedMonth]);

  const { data: staffList, isLoading: sLoading } = useCollection(staffQuery);
  const { data: attendance, isLoading: aLoading } = useCollection(attendanceQuery);
  const { data: earnings } = useCollection(earningsQuery);
  const { data: payrollRecords, isLoading: rLoading } = useCollection(payrollRecordsQuery);

  // Logic to determine which staff need payroll generation
  const pendingPayrollData = useMemo(() => {
    if (!staffList) return [];

    return staffList
      .filter(staff => !payrollRecords?.some(record => record.staffId === staff.id))
      .map(staff => {
        const myAttendance = attendance?.filter(a => a.staffId === staff.id && a.date.startsWith(selectedMonth)) || [];
        const myEarnings = earnings?.filter(e => e.staffId === staff.id && e.createdAt.startsWith(selectedMonth)) || [];
        
        let basePay = 0;
        let commission = 0;

        if (staff.salaryModel === 'daily') {
          basePay = myAttendance.length * (staff.baseRate || 0);
        } else if (staff.salaryModel === 'monthly') {
          basePay = staff.baseRate || 0;
        } else if (staff.salaryModel === 'hybrid') {
          basePay = staff.baseRate || 0;
          commission = myEarnings.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        }

        const total = basePay + commission;

        return {
          staffId: staff.id,
          name: staff.name,
          role: staff.role,
          salaryModel: staff.salaryModel,
          workedDays: myAttendance.length,
          basePay,
          commission,
          totalPay: total
        };
      });
  }, [staffList, attendance, earnings, selectedMonth, payrollRecords]);

  const handleFinalizePayroll = async (data: any) => {
    if (!db) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'payroll_records'), {
        ...data,
        month: selectedMonth,
        status: 'Processed',
        paidStatus: 'Unpaid',
        finalAmount: data.totalPay,
        adjustments: 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Payroll Finalized", description: `${data.name}'s record has been saved.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to finalize payroll." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!db || !confirm("Delete this record? This will return the employee to the pending list.")) return;
    try {
      await deleteDoc(doc(db, 'payroll_records', id));
      toast({ title: "Record Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingRecord) return;
    setIsSubmittingEdit(true);
    try {
      const finalAmount = parseFloat(editingRecord.basePay) + parseFloat(editingRecord.commission) + parseFloat(editingRecord.adjustments);
      await updateDoc(doc(db, 'payroll_records', editingRecord.id), {
        ...editingRecord,
        finalAmount,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Record Updated" });
      setIsEditModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const downloadPayslip = async (record: any) => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1E5F7A; padding-bottom: 20px;">
          <h1 style="color: #1E5F7A; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Smart Clean Bangladesh</h1>
          <p style="margin: 5px 0; font-weight: bold; color: #666;">OFFICIAL SALARY PAYSLIP</p>
          <p style="margin: 0; font-size: 12px; color: #999;">Period: ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Employee Details</p>
            <p style="margin: 0; font-size: 16px; font-weight: bold;">${record.name}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Designation: ${record.role}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Model: ${record.salaryModel.toUpperCase()}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Record ID</p>
            <p style="margin: 0; font-size: 14px; font-weight: bold; font-family: monospace;">#PAY-${record.id.slice(0, 8).toUpperCase()}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">Issued Date: ${format(new Date(), 'PP')}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="text-align: left; padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; text-transform: uppercase;">Description</th>
              <th style="text-align: right; padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; text-transform: uppercase;">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px;">Basic Salary / Base Rate</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">৳${record.basePay.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px;">Total Commission / Service Earnings</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">৳${record.commission.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 14px;">Adjustments (Bonus/Deduction)</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: ${record.adjustments >= 0 ? '#22c55e' : '#ef4444'}">৳${record.adjustments.toLocaleString()}</td>
            </tr>
            <tr style="background: #1E5F7A; color: white;">
              <td style="padding: 15px; font-weight: bold; font-size: 16px;">NET PAYABLE</td>
              <td style="text-align: right; padding: 15px; font-weight: bold; font-size: 20px;">৳${record.finalAmount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase;">Employee Signature</div>
          </div>
          <div style="text-align: center; width: 200px;">
            <div style="border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase;">Authorised Signatory</div>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
          This is a computer generated document and does not require a physical stamp for internal processing.
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Payslip_${record.name.replace(/\s+/g, '_')}_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
    toast({ title: "Downloading PDF", description: "Your payslip is being generated." });
  };

  const totalMonthlyPayout = useMemo(() => {
    const saved = payrollRecords?.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0) || 0;
    const pending = pendingPayrollData.reduce((acc, curr) => acc + curr.totalPay, 0);
    return saved + pending;
  }, [payrollRecords, pendingPayrollData]);

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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Est. Monthly Budget</p>
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
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saved Records</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{payrollRecords?.length || 0} Paid/Logged</h3>
            </div>
            <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden group relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={100} /></div>
          <CardContent className="p-8 flex items-center justify-between h-full relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Disbursement Mode</p>
              <h3 className="text-4xl font-black tracking-tighter italic">LOCKED</h3>
            </div>
            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-widest">Active Audit</Badge>
          </CardContent>
        </Card>
      </div>

      {/* 🟢 SAVED PAYROLL RECORDS */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] px-2 flex items-center gap-2">
          <FileText className="text-primary" size={18} /> Logged & Processed Records
        </h3>
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2.5rem]">
          <CardContent className="p-0 overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-blue-50/30">
                <TableRow className="border-none">
                  <TableHead className="py-6 pl-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Employee</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Base + Comm</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Adj.</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-[#081621]">Final Payout</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-widest text-[#081621]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : payrollRecords?.length ? (
                  payrollRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="py-6 pl-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs uppercase">{record.name?.[0]}</div>
                          <div>
                            <p className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{record.name}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{record.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">৳{record.basePay} + ৳{record.commission}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-xs font-black", record.adjustments >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {record.adjustments >= 0 ? '+' : ''}৳{record.adjustments}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-primary text-sm tracking-tight">৳{record.finalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 bg-blue-50 rounded-xl" onClick={() => downloadPayslip(record)} title="Download Payslip">
                            <FileDown size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary bg-primary/5 rounded-xl" onClick={() => { setEditingRecord(record); setIsEditModalOpen(true); }} title="Edit Record">
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive bg-rose-50 rounded-xl" onClick={() => handleDeleteRecord(record.id)} title="Delete Record">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs text-muted-foreground italic">No finalized records for this month.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 📋 PENDING GENERATION LIST */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
          <Calculator className="text-primary" size={18} /> Pending Generation Queue
        </h3>
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
                ) : pendingPayrollData.map((data) => (
                  <TableRow key={data.staffId} className="hover:bg-gray-50/50 transition-colors group">
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
                      <Button 
                        onClick={() => handleFinalizePayroll(data)}
                        disabled={isProcessing}
                        className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                      >
                        {isProcessing ? <Loader2 className="animate-spin h-3 w-3" /> : <><Check size={14} /> Finalize</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingPayrollData.length === 0 && !sLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-20 italic text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Queue Clear. All personnel records processed.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 🛠️ EDIT PAYROLL MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-widest">Adjust Record</DialogTitle>
              <DialogDescription className="text-white/40 mt-1 uppercase font-bold text-[9px]">Manual override for specific payout</DialogDescription>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </header>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Salary (৳)</Label>
                <Input type="number" value={editingRecord?.basePay} onChange={e => setEditingRecord({...editingRecord, basePay: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Commission (৳)</Label>
                <Input type="number" value={editingRecord?.commission} onChange={e => setEditingRecord({...editingRecord, commission: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-emerald-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Manual Adjustment (Bonus/Penalty)</Label>
                <Input type="number" value={editingRecord?.adjustments} onChange={e => setEditingRecord({...editingRecord, adjustments: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" placeholder="+/- 0.00" />
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">New Net Total</p>
              <p className="text-2xl font-black text-gray-900">৳{(parseFloat(editingRecord?.basePay || 0) + parseFloat(editingRecord?.commission || 0) + parseFloat(editingRecord?.adjustments || 0)).toLocaleString()}</p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-2">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleUpdateRecord} disabled={isSubmittingEdit} className="rounded-xl font-black px-10 h-12 shadow-xl bg-primary text-white uppercase tracking-tighter text-xs">
              {isSubmittingEdit ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Update Record</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

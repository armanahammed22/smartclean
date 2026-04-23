
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  Calendar, 
  MapPin, 
  ClipboardList, 
  TrendingUp,
  Download,
  Users,
  CheckCircle2,
  X,
  Zap,
  Calculator,
  FileText,
  Printer,
  History,
  Clock,
  Briefcase,
  Layers,
  Star,
  Check,
  Wallet,
  DollarSign,
  Handshake,
  TrendingDown,
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

const ALL_WORK_TYPES = [
  { id: 'floor', label: 'Floor Cleaning', unit: 'Square Feet' },
  { id: 'glass', label: 'Glass Cleaning', unit: 'Square Feet' },
  { id: 'sofa', label: 'Sofa Cleaning', unit: 'Pieces' },
  { id: 'deep', label: 'Deep Cleaning', unit: 'Square Feet' },
  { id: 'toilet', label: 'Toilet Cleaning', unit: 'Pieces' },
  { id: 'carpet', label: 'Carpet Cleaning', unit: 'Square Feet' }
];

export default function ProjectOperationalConsole() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const projectRef = useMemoFirebase(() => (db && id) ? doc(db, 'cleaning_projects', id as string) : null, [db, id]);
  const { data: project, isLoading: pLoading } = useDoc(projectRef);

  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db]);
  const { data: employees } = useCollection(employeesQuery);

  // Daily Log Form State
  const [logForm, setLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    workType: '',
    quantity: '',
    notes: '',
    assignments: [] as { uid: string, name: string, cost: number }[]
  });

  const logsQuery = useMemoFirebase(() => 
    (db && id) ? query(collection(db, 'work_entries'), where('projectId', '==', id), orderBy('date', 'desc')) : null, [db, id]);
  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);

  const projectEnabledTypes = useMemo(() => {
    if (!project?.activeWorkTypes) return [];
    return ALL_WORK_TYPES.filter(t => project.activeWorkTypes.includes(t.id));
  }, [project]);

  // Comprehensive Financial Calculation Engine
  const summary = useMemo(() => {
    if (!logs || !project?.rates || !project?.activeWorkTypes) return null;
    
    // 1. Calculate Revenue by Component
    const components = project.activeWorkTypes.map(typeId => {
      const typeInfo = ALL_WORK_TYPES.find(t => t.id === typeId);
      const totalQty = logs.filter(l => l.workType === typeId).reduce((acc, c) => acc + (c.quantity || 0), 0);
      const rate = project.rates[typeId] || 0;
      return { id: typeId, label: typeInfo?.label, totalQty, rate, amount: totalQty * rate };
    }).filter(c => c.totalQty > 0);

    const grossRevenue = components.reduce((a, c) => a + c.amount, 0);

    // 2. Calculate Commission (B2B)
    let partnerCommission = 0;
    if (project.partnerId !== 'none') {
      partnerCommission = project.commissionType === 'percentage' 
        ? (grossRevenue * (project.commissionValue || 0)) / 100 
        : (project.commissionValue || 0);
    }

    // 3. Calculate Employee Labor Cost
    const laborCost = logs.reduce((acc, log) => {
      return acc + (log.employeeAssignments?.reduce((eAcc: number, e: any) => eAcc + (e.cost || 0), 0) || 0);
    }, 0);

    const netProfit = grossRevenue - (partnerCommission + laborCost);
    const progress = project.totalArea > 0 ? Math.min(100, Math.round((components.filter(c => c.id === 'floor' || c.id === 'deep').reduce((a,c)=>a+c.totalQty,0) / project.totalArea) * 100)) : 0;

    return { components, grossRevenue, partnerCommission, laborCost, netProfit, progress };
  }, [logs, project]);

  const handleToggleEmployee = (emp: any) => {
    const isAssigned = logForm.assignments.find(a => a.uid === emp.id);
    if (isAssigned) {
      setLogForm({ ...logForm, assignments: logForm.assignments.filter(a => a.uid !== emp.id) });
    } else {
      setLogForm({ ...logForm, assignments: [...logForm.assignments, { uid: emp.id, name: emp.name, cost: emp.baseRate || 0 }] });
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !logForm.workType) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'work_entries'), {
        ...logForm,
        projectId: id,
        unitType: ALL_WORK_TYPES.find(t => t.id === logForm.workType)?.unit,
        quantity: parseFloat(logForm.quantity) || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Operation Logged" });
      setIsLogDialogOpen(false);
      setLogForm({ ...logForm, workType: '', quantity: '', notes: '', assignments: [] });
      
      // Auto Update Partner Project Amount if linked
      if (project.partnerId !== 'none' && summary) {
        const partnerProjRef = doc(db, 'partner_projects', project.id);
        await setDoc(partnerProjRef, {
          projectAmount: summary.grossRevenue,
          commissionAmount: summary.partnerCommission,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!db || !id || !summary) return;
    if (!confirm("Finalize project? This will generate the invoice and lock records.")) return;
    
    setIsFinalizing(true);
    try {
      await updateDoc(doc(db, 'cleaning_projects', id as string), {
        status: 'Completed',
        finalBillAmount: summary.grossRevenue,
        totalCommission: summary.partnerCommission,
        totalEmployeeCost: summary.laborCost,
        finalizedAt: new Date().toISOString()
      });

      // Update B2B Partner Status
      if (project.partnerId !== 'none') {
        await updateDoc(doc(db, 'partner_projects', id as string), { status: 'Completed', updatedAt: serverTimestamp() });
      }

      const invRef = await addDoc(collection(db, 'invoices'), {
        invoiceNumber: `INV-PRJ-${id.toString().slice(0,6).toUpperCase()}`,
        projectId: id,
        customerInfo: { name: project.clientName, address: project.location, phone: project.phone || 'N/A' },
        items: summary.components.map(c => ({ name: c.label, type: 'project_work', quantity: c.totalQty, price: c.rate })),
        subtotal: summary.grossRevenue,
        tax: summary.grossRevenue * 0.08,
        total: summary.grossRevenue * 1.08,
        paymentStatus: 'Unpaid',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Contract Finalized", description: "Invoice generated." });
      router.push(`/admin/invoices/${invRef.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Finalizing" });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (pLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/projects')} className="rounded-full bg-white shadow-sm border h-10 w-10"><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{project?.clientName}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <MapPin size={10} className="text-primary"/> Operational Logic active since {format(new Date(project?.createdAt || Date.now()), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] border-primary/20 text-primary gap-2"><FileText size={16} /> Print Report</Button>
          {project?.status !== 'Completed' && (
            <Button onClick={handleFinalize} disabled={isFinalizing} className="rounded-xl h-11 px-8 font-black uppercase text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2">
              {isFinalizing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Finalize & Bill</>}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Financial Overview Panel (Admin Only) */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} className="text-primary" /></div>
            <CardContent className="p-10 relative z-10 space-y-8">
              <div>
                <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 mb-4">Internal Profit Analytics</Badge>
                <div className="space-y-1">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Gross Unbilled Revenue</p>
                  <h3 className="text-5xl font-black tracking-tighter text-primary italic">৳{summary?.grossRevenue.toLocaleString() || 0}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[8px] font-black uppercase text-white/40">B2B Commission</p>
                  <p className="text-sm font-black text-rose-400">-৳{summary?.partnerCommission.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                  <p className="text-[8px] font-black uppercase text-white/40">Workforce Cost</p>
                  <p className="text-sm font-black text-rose-400">-৳{summary?.laborCost.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Estimated Profit</p>
                    <p className="text-2xl font-black text-emerald-400">৳{summary?.netProfit.toLocaleString() || 0}</p>
                 </div>
                 <PieChart size={40} className="text-emerald-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-6 border-b flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Component Breakdown</CardTitle>
                <Calculator size={16} className="text-primary" />
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                {summary?.components.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                      <p className="font-black text-gray-900 uppercase text-[10px]">{item.label}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{item.totalQty.toLocaleString()} units @ ৳{item.rate}</p>
                    </div>
                    <span className="font-black text-sm text-gray-900">৳{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                {!summary?.components.length && <p className="text-center py-6 text-[10px] font-bold text-gray-300 uppercase">No work recorded yet.</p>}
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
              <History size={18} className="text-primary" /> Operation Log Stream
            </h3>
            {project?.status !== 'Completed' && (
              <Button onClick={() => setIsLogDialogOpen(true)} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg bg-primary">
                <Plus size={16} className="mr-2" /> Log Daily Entry
              </Button>
            )}
          </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] border border-gray-100">
             <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest">Timeline</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Activity & Force</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Volume</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">Force Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lLoading ? <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow> : 
                      logs?.map((log) => {
                        const typeInfo = ALL_WORK_TYPES.find(t => t.id === log.workType);
                        const cost = log.employeeAssignments?.reduce((a: number, e: any) => a + (e.cost || 0), 0) || 0;
                        return (
                          <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                            <TableCell className="py-6 pl-8">
                              <div className="font-black text-gray-900 text-xs">{format(new Date(log.date), 'MMM dd')}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{typeInfo?.label || log.workType}</span>
                                <div className="flex -space-x-2">
                                  {log.employeeAssignments?.map((emp: any, idx: number) => (
                                    <div key={idx} className="w-5 h-5 rounded-full bg-indigo-100 border border-white flex items-center justify-center text-[7px] font-black text-indigo-600 uppercase" title={emp.name}>{emp.name[0]}</div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-black text-gray-900 text-sm">
                                {log.quantity.toLocaleString()} <span className="text-[8px] text-gray-400 font-bold uppercase">{log.unitType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8 font-black text-xs text-rose-500">
                               ৳{cost.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    }
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] p-0 border-none shadow-2xl bg-white flex flex-col overflow-hidden rounded-none md:rounded-[3rem]">
          <header className="p-8 bg-[#081621] text-white shrink-0 flex justify-between items-center">
            <div className="space-y-1">
              <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center gap-3"><Clock className="text-primary"/> Workforce Intake</DialogTitle>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase">Log activities and assign personnel to calculate daily burn</DialogDescription>
            </div>
            <button onClick={() => setIsLogDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
            <form onSubmit={handleAddLog} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Activity Details</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Date</Label>
                      <Input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Component</Label>
                      <Select value={logForm.workType} onValueChange={v => setLogForm({...logForm, workType: v})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Work Type..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {projectEnabledTypes.map(t => <SelectItem key={t.id} value={t.id} className="font-bold text-[10px] uppercase py-3">{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quantity (Volume)</Label>
                      <Input type="number" value={logForm.quantity} onChange={e => setLogForm({...logForm, quantity: e.target.value})} placeholder="0.00" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-lg text-primary shadow-inner" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Personnel & Labor Costs</h4>
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col h-[300px] overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                       <Label className="text-[9px] font-black uppercase text-gray-400">Select Staff Members</Label>
                       <Badge className="bg-indigo-600 text-white border-none text-[8px]">{logForm.assignments.length} ACTIVE</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {employees?.map(emp => {
                        const assigned = logForm.assignments.find(a => a.uid === emp.id);
                        return (
                          <div key={emp.id} className={cn("p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between", assigned ? "border-primary bg-primary/5" : "bg-white border-transparent hover:border-primary/20")} onClick={() => handleToggleEmployee(emp)}>
                             <div className="flex items-center gap-3">
                               <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px]", assigned ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>{emp.name[0]}</div>
                               <div className="min-w-0"><p className="text-[10px] font-bold uppercase truncate">{emp.name}</p><p className="text-[8px] text-gray-400 font-bold">RATE: ৳{emp.baseRate}</p></div>
                             </div>
                             {assigned && <CheckCircle2 size={16} className="text-primary"/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Operational Observation</Label>
                <Textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="Notes on site conditions, extra materials used, or workforce performance..." className="bg-gray-50 border-none rounded-[2rem] min-h-[100px] p-6 text-sm" />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl bg-primary text-white active:scale-95 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2" /> Commit Entry to Database</>}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

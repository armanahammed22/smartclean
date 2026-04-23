
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

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

  // Daily Log Form
  const [logForm, setLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    workType: '',
    quantity: '',
    workers: '',
    notes: ''
  });

  const logsQuery = useMemoFirebase(() => 
    (db && id) ? query(collection(db, 'work_entries'), where('projectId', '==', id), orderBy('date', 'desc')) : null, [db, id]);
  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);

  // Filter ONLY work types defined in the project rate matrix
  const projectEnabledTypes = useMemo(() => {
    if (!project?.activeWorkTypes) return [];
    return ALL_WORK_TYPES.filter(t => project.activeWorkTypes.includes(t.id));
  }, [project]);

  // Billing Logic based on dynamic matrix
  const billingSummary = useMemo(() => {
    if (!logs || !project?.rates || !project?.activeWorkTypes) return [];
    
    return project.activeWorkTypes.map(typeId => {
      const typeInfo = ALL_WORK_TYPES.find(t => t.id === typeId);
      const typeLogs = logs.filter(l => l.workType === typeId);
      const totalQty = typeLogs.reduce((acc, c) => acc + (c.quantity || 0), 0);
      const rate = project.rates[typeId] || 0;
      return {
        id: typeId,
        label: typeInfo?.label || typeId,
        unit: typeInfo?.unit || 'Units',
        totalQty,
        rate,
        totalAmount: totalQty * rate
      };
    }).filter(item => item.totalQty > 0);
  }, [logs, project]);

  const grandTotal = billingSummary.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalSqftDone = billingSummary.filter(b => b.unit === 'Square Feet').reduce((a,c)=>a+c.totalQty, 0);
  const progress = project?.totalArea > 0 ? Math.min(100, Math.round((totalSqftDone / project.totalArea) * 100)) : 0;

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id) return;
    if (!logForm.workType) {
      toast({ variant: "destructive", title: "Selection Missing", description: "Please select a work type." });
      return;
    }
    if (project?.status === 'Completed') {
      toast({ variant: "destructive", title: "Project Locked", description: "Completed projects cannot be edited." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'work_entries'), {
        ...logForm,
        projectId: id,
        unitType: ALL_WORK_TYPES.find(t => t.id === logForm.workType)?.unit,
        quantity: parseFloat(logForm.quantity) || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Log Registry Updated" });
      setIsLogDialogOpen(false);
      setLogForm({ ...logForm, workType: '', quantity: '', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving Log" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeProject = async () => {
    if (!db || !id || !project) return;
    if (!confirm("Finalize project and generate bill? This will lock all work entries.")) return;
    
    setIsFinalizing(true);
    try {
      await updateDoc(doc(db, 'cleaning_projects', id as string), {
        status: 'Completed',
        finalBillAmount: grandTotal,
        finalizedAt: new Date().toISOString()
      });

      const invRef = await addDoc(collection(db, 'invoices'), {
        invoiceNumber: `PRJ-${id.toString().slice(0,6).toUpperCase()}`,
        projectId: id,
        customerInfo: {
          name: project.clientName,
          address: project.location,
          phone: project.phone || 'N/A'
        },
        items: billingSummary.map(b => ({
          name: b.label,
          type: 'service',
          quantity: b.totalQty,
          price: b.rate
        })),
        subtotal: grandTotal,
        tax: grandTotal * 0.08,
        total: grandTotal * 1.08,
        paymentStatus: 'Unpaid',
        paymentMethod: 'Cash/Check',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Project Finalized", description: "Invoice generated successfully." });
      router.push(`/admin/invoices/${invRef.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Finalization Failed" });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (pLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!project) return <div className="p-20 text-center uppercase font-black opacity-20">Registry Entry Missing</div>;

  return (
    <div className="space-y-8 pb-24 min-w-0" id="project-report">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/projects')} className="rounded-full bg-white shadow-sm border h-10 w-10">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">{project.clientName}</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <MapPin size={10} className="text-primary"/> {project.location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary gap-2">
            <FileText size={16} /> Full Report
          </Button>
          {project.status !== 'Completed' ? (
            <Button onClick={handleFinalizeProject} disabled={isFinalizing} className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2">
              {isFinalizing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Finalize & Bill</>}
            </Button>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-700 border-none font-black h-11 px-6 rounded-xl uppercase text-xs">COMPLETED</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} className="text-primary" /></div>
            <CardContent className="p-10 relative z-10 space-y-8">
              <div>
                <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 mb-4">LIVE REVENUE TERMINAL</Badge>
                <div className="space-y-1">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Unbilled Net</p>
                  <h3 className="text-5xl font-black tracking-tighter text-primary italic">৳{grandTotal.toLocaleString()}</h3>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-white/40">Work Completion</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-6 border-b flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-[#081621]">Rate Matrix Pinned</CardTitle>
                <Calculator size={16} className="text-primary" />
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                {billingSummary.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="space-y-0.5">
                      <p className="font-black text-gray-900 uppercase text-[10px]">{item.label}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{item.totalQty} {item.unit} @ ৳{item.rate}</p>
                    </div>
                    <span className="font-black text-sm text-gray-900">৳{item.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-6 mt-6 border-t border-dashed border-gray-200 flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-gray-400">Project Total</span>
                  <span className="text-2xl font-black text-primary">৳{grandTotal.toLocaleString()}</span>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2 no-print">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
              <History size={18} className="text-primary" /> Daily Activity Feed
            </h3>
            {project.status !== 'Completed' && (
              <Button onClick={() => setIsLogDialogOpen(true)} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg bg-primary">
                <Plus size={16} className="mr-2" /> Log Entry
              </Button>
            )}
          </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] border border-gray-100">
             <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest">Timeline</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Activity Description</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Volume</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">Valuation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lLoading ? <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow> : 
                      logs?.map((log) => {
                        const rate = project.rates?.[log.workType] || 0;
                        const typeInfo = ALL_WORK_TYPES.find(t => t.id === log.workType);
                        return (
                          <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                            <TableCell className="py-6 pl-8">
                              <div className="font-black text-gray-900 text-xs">{format(new Date(log.date), 'MMM dd, yyyy')}</div>
                              <div className="text-[8px] font-bold text-gray-400 uppercase mt-1">{log.workers || 'General Team'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                                  <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{typeInfo?.label || log.workType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-black text-gray-900 text-sm">
                                {log.quantity.toLocaleString()} <span className="text-[9px] text-gray-400 font-bold uppercase">{log.unitType}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-8 font-black text-xs text-indigo-600">
                               ৳{(log.quantity * rate).toLocaleString()}
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
        <DialogContent className="max-w-xl rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-white flex flex-col">
          <header className="p-8 bg-[#081621] text-white shrink-0 flex justify-between items-center">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Clock className="text-primary"/> Operation Intake
              </DialogTitle>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Enroll operational metrics from matrix selection</DialogDescription>
            </div>
            <button onClick={() => setIsLogDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </header>
          
          <div className="p-10 space-y-8 bg-white">
            <form onSubmit={handleAddLog} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Date</Label>
                  <Input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Matrix Component</Label>
                  <Select value={logForm.workType} onValueChange={v => setLogForm({...logForm, workType: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue placeholder="Select Enabled Work..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {projectEnabledTypes.map(t => (
                        <SelectItem key={t.id} value={t.id} className="font-bold text-[10px] uppercase py-3">
                          {t.label} (৳{project.rates[t.id]}/{t.unit})
                        </SelectItem>
                      ))}
                      {projectEnabledTypes.length === 0 && <SelectItem value="none" disabled>No rates defined for project</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Volume Quantity</Label>
                  <Input type="number" value={logForm.quantity} onChange={e => setLogForm({...logForm, quantity: e.target.value})} placeholder="0.00" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Worker / Force</Label>
                  <Input value={logForm.workers} onChange={e => setLogForm({...logForm, workers: e.target.value})} placeholder="Team Name" className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Observation Memo</Label>
                <Textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="Report any site specific issues..." className="bg-gray-50 border-none rounded-2xl min-h-[100px] p-4 text-xs" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl bg-primary text-white">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Log Entry</>}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

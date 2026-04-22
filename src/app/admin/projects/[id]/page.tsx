
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
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WORK_TYPES = ["Floor Cleaning", "Glass Cleaning", "Sofa Cleaning", "Deep Cleaning", "Toilet Cleaning", "Carpet Cleaning", "Other"];
const UNIT_TYPES = ["Square Feet", "Pieces", "KG", "Feet", "Meter"];

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Daily Log
  const [logForm, setLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    workType: 'Floor Cleaning',
    quantity: '',
    unitType: 'Square Feet',
    workers: '',
    notes: ''
  });

  const projectRef = useMemoFirebase(() => (db && id) ? doc(db, 'cleaning_projects', id as string) : null, [db, id]);
  const { data: project, isLoading: pLoading } = useDoc(projectRef);

  const logsQuery = useMemoFirebase(() => 
    (db && id) ? query(collection(db, 'work_entries'), where('projectId', '==', id), orderBy('date', 'desc')) : null, [db, id]);
  const { data: logs, isLoading: lLoading } = useCollection(logsQuery);

  const stats = useMemo(() => {
    if (!logs) return { sqft: 0, pieces: 0, entries: 0 };
    return {
      sqft: logs.filter(l => l.unitType === 'Square Feet').reduce((acc, c) => acc + (c.quantity || 0), 0),
      pieces: logs.filter(l => l.unitType === 'Pieces').reduce((acc, c) => acc + (c.quantity || 0), 0),
      entries: logs.length
    };
  }, [logs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'work_entries'), {
        ...logForm,
        projectId: id,
        quantity: parseFloat(logForm.quantity) || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Log Entry Saved" });
      setIsLogDialogOpen(false);
      setLogForm({ ...logForm, quantity: '', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving Log" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('report-content');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Project_Report_${project?.clientName}_${format(new Date(), 'dd_MMM')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (pLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;
  if (!project) return <div className="p-20 text-center uppercase font-black opacity-20">Project Record Not Found</div>;

  const progress = project.totalArea > 0 ? Math.min(100, Math.round((stats.sqft / project.totalArea) * 100)) : 0;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
          <Button variant="outline" onClick={exportPDF} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary gap-2">
            <FileText size={16} /> Export Report
          </Button>
          <Button onClick={() => setIsLogDialogOpen(true)} className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
            <Plus size={18} /> New Work Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><Zap size={120} className="text-primary" /></div>
            <CardContent className="p-10 relative z-10 space-y-8">
              <div>
                <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 mb-4">Project Status: {project.status}</Badge>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Coverage</p>
                    <h3 className="text-4xl font-black tracking-tighter">{project.totalArea.toLocaleString()} <span className="text-sm font-bold opacity-40 uppercase tracking-normal">Sqft</span></h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                  <span className="text-white/40">Completion</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-white/40">Done (Sqft)</p>
                  <p className="text-xl font-black">{stats.sqft.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-white/40">Remaining</p>
                  <p className="text-xl font-black text-rose-500">{(project.totalArea - stats.sqft).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl p-8 space-y-6 border border-gray-100">
             <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><ClipboardList size={16}/> Project Scope</h3>
             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-gray-50 text-gray-400 rounded-lg"><Calendar size={14}/></div>
                   <div><p className="text-[9px] font-black text-gray-400 uppercase">Timeline</p><p className="text-xs font-bold">{project.startDate} to {project.endDate}</p></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl text-xs font-medium text-gray-600 leading-relaxed italic border border-gray-100">
                   "{project.notes || 'No scope notes provided'}"
                </div>
             </div>
          </Card>
        </div>

        {/* Right: Work Entry Logs */}
        <div className="lg:col-span-8 space-y-6" id="report-content">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
              <History size={18} className="text-primary" /> Daily Operations Log
            </h3>
            <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black text-[9px] uppercase px-3 py-1 rounded-full">{logs?.length || 0} TOTAL ENTRIES</Badge>
          </div>

          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem] border border-gray-100">
             <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-none">
                      <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest">Entry Date</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Task Details</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Volume</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Personnel</TableHead>
                      <TableHead className="text-right pr-8 font-black uppercase text-[10px] tracking-widest">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lLoading ? <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow> : 
                      logs?.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                          <TableCell className="py-6 pl-8">
                            <div className="font-black text-gray-900 text-xs">{format(new Date(log.date), 'MMM dd, yyyy')}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-xl",
                                log.workType.includes('Floor') ? "bg-blue-50 text-blue-600" :
                                log.workType.includes('Deep') ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                              )}>
                                <Zap size={14} fill="currentColor" />
                              </div>
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{log.workType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-black text-gray-900 text-sm">
                              {log.quantity.toLocaleString()} <span className="text-[9px] text-gray-400 font-bold uppercase">{log.unitType}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg"><Users size={12}/></div>
                              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest truncate max-w-[100px]">{log.workers || 'Team A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50" onClick={() => deleteDoc(doc(db!, 'work_entries', log.id))}>
                               <Trash2 size={16} />
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                    {logs?.length === 0 && !lLoading && (
                      <TableRow><TableCell colSpan={5} className="py-24 text-center italic text-muted-foreground uppercase font-black tracking-widest text-[10px]">No work entries recorded for this site.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* 🛠️ ADD LOG DIALOG */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <Clock className="text-primary"/> Record Daily Entry
              </DialogTitle>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Log operational task data into registry</DialogDescription>
            </div>
            <button onClick={() => setIsLogDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>
          <form onSubmit={handleAddLog} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Date</Label>
                <Input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Task Category</Label>
                <Select value={logForm.workType} onValueChange={v => setLogForm({...logForm, workType: v})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {WORK_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold text-[10px] uppercase">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Volume (Quantity)</Label>
                <Input type="number" value={logForm.quantity} onChange={e => setLogForm({...logForm, quantity: e.target.value})} placeholder="0.00" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Measurement Unit</Label>
                <Select value={logForm.unitType} onValueChange={v => setLogForm({...logForm, unitType: v})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {UNIT_TYPES.map(u => <SelectItem key={u} value={u} className="font-bold text-[10px] uppercase">{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Worker(s) / Team Names</Label>
                <Input value={logForm.workers} onChange={e => setLogForm({...logForm, workers: e.target.value})} placeholder="e.g. Team Alpha (Karim, Rahim)" className="h-12 bg-gray-50 border-none rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Observations / Issues</Label>
              <Textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="Any site issues or special mentions..." className="bg-gray-50 border-none rounded-2xl min-h-[80px] p-4 text-sm" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Commit Entry to Database"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="m12 7v5l4 2" />
    </svg>
  );
}

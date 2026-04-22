'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Loader2,
  LayoutGrid,
  CheckCircle2,
  Clock,
  ArrowRight,
  Maximize2,
  X,
  Building2,
  ChevronRight,
  AlertTriangle,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProjectManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    location: '',
    startDate: '',
    endDate: '',
    totalArea: '',
    status: 'Active' as any,
    partnerId: 'none',
    notes: ''
  });

  const projectsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'cleaning_projects'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const workEntriesQuery = useMemoFirebase(() => db ? collection(db, 'work_entries') : null, [db]);
  const { data: allWorkEntries } = useCollection(workEntriesQuery);

  const partnersQuery = useMemoFirebase(() => db ? query(collection(db, 'partners'), orderBy('name', 'asc')) : null, [db]);
  const { data: partners } = useCollection(partnersQuery);

  const filtered = projects?.filter(p => 
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    if (!projects || !allWorkEntries) return { total: 0, active: 0, totalSqft: 0 };
    const sqftCleaned = allWorkEntries
      .filter(w => w.unitType === 'Square Feet')
      .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'Active').length,
      totalSqft: sqftCleaned
    };
  }, [projects, allWorkEntries]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);
    try {
      const selectedPartner = partners?.find(p => p.id === formData.partnerId);
      
      await addDoc(collection(db, 'cleaning_projects'), {
        ...formData,
        partnerName: selectedPartner?.name || null,
        totalArea: parseFloat(formData.totalArea) || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Project Created", description: "Operation management is now active." });
      setIsDialogOpen(false);
      setFormData({ clientName: '', location: '', startDate: '', endDate: '', totalArea: '', status: 'Active', partnerId: 'none', notes: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Projects Desk</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <Briefcase size={16} className="text-primary"/> Managing cleaning contracts and daily logs
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest transition-all active:scale-95">
          <Plus size={18} /> Plan New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active Projects", val: stats.active, icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Sqft Cleaned", val: stats.totalSqft.toLocaleString(), icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Daily Feed", val: "Logs Active", icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Total Managed", val: stats.total, icon: LayoutGrid, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
        <Input 
          placeholder="Search by client or site location..." 
          className="h-12 pl-12 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : filtered?.map((proj) => {
          const projectWork = allWorkEntries?.filter(w => w.projectId === proj.id && w.unitType === 'Square Feet') || [];
          const sqftDone = projectWork.reduce((acc, curr) => acc + curr.quantity, 0);
          const progress = proj.totalArea > 0 ? Math.min(100, Math.round((sqftDone / proj.totalArea) * 100)) : 0;
          
          return (
            <Card key={proj.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100/50 hover:shadow-xl transition-all duration-500">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{proj.clientName}</h3>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                      <MapPin size={12} className="text-primary"/> {proj.location}
                    </div>
                    {proj.partnerName && (
                      <div className="flex items-center gap-1.5 text-indigo-600 text-[8px] font-black uppercase tracking-widest mt-1">
                        <Building2 size={10} /> Partner: {proj.partnerName}
                      </div>
                    )}
                  </div>
                  <Badge className={cn(
                    "text-[8px] font-black border-none uppercase px-2 py-0.5 rounded-md",
                    proj.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  )}>{proj.status}</Badge>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Progress</p>
                      <p className="text-sm font-black text-gray-900">{sqftDone.toLocaleString()} / {proj.totalArea.toLocaleString()} <span className="text-[10px] text-gray-400">Sqft</span></p>
                    </div>
                    <span className="text-lg font-black text-primary italic">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Start Date</p>
                    <p className="text-[10px] font-black text-gray-700">{proj.startDate}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Due Completion</p>
                    <p className="text-[10px] font-black text-gray-700">{proj.endDate}</p>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button asChild className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10">
                    <Link href={`/admin/projects/${proj.id}`}>Project Console <ArrowRight size={14} className="ml-2"/></Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-destructive hover:bg-red-50" onClick={() => { if(confirm("Delete project?")) deleteDoc(doc(db!, 'cleaning_projects', proj.id)); }}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 🛠️ ADD PROJECT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-white flex flex-col overflow-hidden">
          <header className="p-6 md:p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Briefcase className="text-primary"/> 
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-widest">Initialize Contract</DialogTitle>
              </div>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Setup new operational cleaning project</DialogDescription>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white custom-scrollbar">
            <form onSubmit={handleAddProject} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Client / Project Name</Label>
                    <Input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} required placeholder="e.g. Grameenphone HQ" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">B2B Partner Link (Optional)</Label>
                    <Select value={formData.partnerId} onValueChange={v => setFormData({...formData, partnerId: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-black text-indigo-600 uppercase text-[10px]">
                        <div className="flex items-center gap-2"><Building2 size={14}/> <SelectValue placeholder="No Partner" /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">No Associated Partner</SelectItem>
                        {partners?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Location Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required placeholder="Site Physical Address" className="h-12 pl-11 bg-gray-50 border-none rounded-xl font-medium" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Start Date</Label>
                      <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">End Date</Label>
                      <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Area (Sqft)</Label>
                      <Input type="number" value={formData.totalArea} onChange={e => setFormData({...formData, totalArea: e.target.value})} required placeholder="0.00" className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Status</Label>
                      <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Admin Notes / Scope of Work</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe technical scope, team assignments, or client special instructions..." className="bg-gray-50 border-none rounded-2xl min-h-[120px] p-6 font-medium focus:bg-white transition-all shadow-inner" />
              </div>
            </form>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
             <Button onClick={handleAddProject} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Project</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

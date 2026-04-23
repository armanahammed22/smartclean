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
  X,
  Building2,
  DollarSign,
  Save,
  Calculator,
  ListPlus,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WORK_TYPES = [
  { id: 'floor', label: 'Floor Cleaning', unit: 'Square Feet' },
  { id: 'glass', label: 'Glass Cleaning', unit: 'Square Feet' },
  { id: 'sofa', label: 'Sofa Cleaning', unit: 'Pieces' },
  { id: 'deep', label: 'Deep Cleaning', unit: 'Square Feet' },
  { id: 'toilet', label: 'Toilet Cleaning', unit: 'Pieces' },
  { id: 'carpet', label: 'Carpet Cleaning', unit: 'Square Feet' }
];

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
    duration: '7',
    totalArea: '',
    status: 'Ongoing' as any,
    partnerId: 'none',
    notes: '',
    activeWorkTypes: [] as string[], // Track which types are selected for this project
    rates: {} as Record<string, number>
  });

  const projectsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'cleaning_projects'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: projects, isLoading } = useCollection(projectsQuery);

  const partnersQuery = useMemoFirebase(() => db ? query(collection(db, 'partners'), orderBy('name', 'asc')) : null, [db]);
  const { data: partners } = useCollection(partnersQuery);

  const filtered = projects?.filter(p => 
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    if (!projects) return { total: 0, ongoing: 0, revenue: 0 };
    return {
      total: projects.length,
      ongoing: projects.filter(p => p.status === 'Ongoing').length,
      revenue: projects.filter(p => p.status === 'Completed').reduce((acc, curr) => acc + (curr.finalBillAmount || 0), 0)
    };
  }, [projects]);

  const addWorkTypeToMatrix = (typeId: string) => {
    if (formData.activeWorkTypes.includes(typeId)) return;
    setFormData(prev => ({
      ...prev,
      activeWorkTypes: [...prev.activeWorkTypes, typeId],
      rates: { ...prev.rates, [typeId]: prev.rates[typeId] || 0 }
    }));
  };

  const removeWorkTypeFromMatrix = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      activeWorkTypes: prev.activeWorkTypes.filter(id => id !== typeId)
    }));
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.clientName || !formData.startDate || formData.activeWorkTypes.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Client, Start Date, and at least one Work Type are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedPartner = partners?.find(p => p.id === formData.partnerId);
      
      const endDate = new Date(formData.startDate);
      endDate.setDate(endDate.getDate() + parseInt(formData.duration));

      await addDoc(collection(db, 'cleaning_projects'), {
        ...formData,
        endDate: endDate.toISOString().split('T')[0],
        partnerName: selectedPartner?.name || null,
        totalArea: parseFloat(formData.totalArea) || 0,
        createdAt: new Date().toISOString()
      });
      
      toast({ title: "Project Initialized", description: "Operational tracking and rate matrix are now active." });
      setIsDialogOpen(false);
      setFormData({ 
        clientName: '', location: '', startDate: '', duration: '7', totalArea: '', status: 'Ongoing', partnerId: 'none', notes: '',
        activeWorkTypes: [],
        rates: {}
      });
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Projects Hub</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <Briefcase size={16} className="text-primary"/> Managing professional contracts and billable logs
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest transition-all active:scale-95">
          <Plus size={18} /> Plan New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Projects", val: stats.total, icon: Briefcase, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Ongoing Jobs", val: stats.ongoing, icon: Clock, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Completed Revenue", val: `৳${stats.revenue.toLocaleString()}`, icon: DollarSign, bg: "bg-emerald-50", color: "text-emerald-600" },
          { label: "Operational Registry", val: "Active", icon: LayoutGrid, bg: "bg-indigo-50", color: "text-indigo-600" }
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
          placeholder="Search client name or site address..." 
          className="h-12 pl-12 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : filtered?.map((proj) => (
          <Card key={proj.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group border border-gray-100/50 hover:shadow-xl transition-all duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{proj.clientName}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <MapPin size={12} className="text-primary"/> {proj.location}
                  </div>
                </div>
                <Badge className={cn(
                  "text-[8px] font-black border-none uppercase px-2 py-0.5 rounded-md",
                  proj.status === 'Ongoing' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}>{proj.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Timeline</p>
                  <p className="text-[10px] font-black text-gray-700">{proj.startDate} <span className="text-gray-300">→</span> {proj.endDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Target Area</p>
                  <p className="text-[10px] font-black text-gray-700">{proj.totalArea.toLocaleString()} Sqft</p>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button asChild className="flex-1 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10">
                  <Link href={`/admin/projects/${proj.id}`}>Operational Console <ArrowRight size={14} className="ml-2"/></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-destructive hover:bg-red-50" onClick={() => { if(confirm("Delete project registry?")) deleteDoc(doc(db!, 'cleaning_projects', proj.id)); }}>
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-white flex flex-col overflow-hidden">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Briefcase className="text-primary"/> 
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-widest">Project Configuration</DialogTitle>
              </div>
              <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Setup contract parameters and select work types</DialogDescription>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-white custom-scrollbar">
            <form onSubmit={handleAddProject} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Plus size={14}/> General Identity</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Client Name</Label>
                      <Input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} required placeholder="e.g. Grameenphone HQ" className="h-12 bg-gray-50 border-none rounded-xl font-bold shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Associated B2B Partner</Label>
                      <Select value={formData.partnerId} onValueChange={v => setFormData({...formData, partnerId: v})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Internal Project" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none" className="font-bold text-[10px] uppercase">None (Direct Client)</SelectItem>
                          {partners?.map(p => <SelectItem key={p.id} value={p.id} className="font-bold text-[10px] uppercase">{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Start Date</Label>
                        <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Duration (Days)</Label>
                        <Select value={formData.duration} onValueChange={v => setFormData({...formData, duration: v})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {['1','3','7','15','30','90'].map(d => <SelectItem key={d} value={d} className="font-bold text-[10px] uppercase">{d} Days Cycle</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Site Address</Label>
                      <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required placeholder="Detailed Address" className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b pb-2 flex items-center gap-2"><Calculator size={14}/> Unit Rate Matrix</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Add Work Type to Project</Label>
                      <Select value="" onValueChange={addWorkTypeToMatrix}>
                        <SelectTrigger className="h-12 bg-indigo-50 border-none rounded-xl font-black text-indigo-600 text-[10px] uppercase shadow-inner">
                          <div className="flex items-center gap-2"><ListPlus size={16}/> Select and Add...</div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {WORK_TYPES.map(t => (
                            <SelectItem key={t.id} value={t.id} className="font-bold text-[10px] uppercase py-3" disabled={formData.activeWorkTypes.includes(t.id)}>
                              {t.label} ({t.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      {formData.activeWorkTypes.map(typeId => {
                        const type = WORK_TYPES.find(t => t.id === typeId);
                        return (
                          <div key={typeId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4 animate-in slide-in-from-right-4">
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-900 uppercase">{type?.label}</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase">Rate per {type?.unit}</p>
                            </div>
                            <div className="relative w-32 shrink-0">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">৳</span>
                              <Input 
                                type="number" 
                                value={formData.rates[typeId]} 
                                onChange={e => setFormData({
                                  ...formData, 
                                  rates: { ...formData.rates, [typeId]: parseFloat(e.target.value) || 0 }
                                })} 
                                className="h-10 pl-7 bg-white border-none rounded-xl font-black text-xs text-right shadow-inner" 
                              />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeWorkTypeFromMatrix(typeId)} className="text-red-400 hover:text-red-600">
                              <X size={16} />
                            </Button>
                          </div>
                        );
                      })}
                      {formData.activeWorkTypes.length === 0 && (
                        <div className="p-10 text-center border-2 border-dashed rounded-2xl opacity-20">
                          <Zap size={32} className="mx-auto mb-2" />
                          <p className="text-[9px] font-black uppercase">No Work Types Added</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Est. Total Area (Sqft)</Label>
                      <Input type="number" value={formData.totalArea} onChange={e => setFormData({...formData, totalArea: e.target.value})} placeholder="0.00" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Scope / Specific Instructions</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Describe technical scope or special client instructions..." className="bg-gray-50 border-none rounded-[2rem] min-h-[100px] p-6 font-medium" />
              </div>
            </form>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
             <Button onClick={handleAddProject} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Project Engine</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  Briefcase, 
  Users, 
  MapPin, 
  Calendar, 
  Wrench, 
  Zap,
  CheckCircle2,
  Building2,
  DollarSign,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syncProjectToLedger } from '@/lib/partner-utils';

export default function NewPartnerProjectPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    partnerId: '',
    title: '',
    projectAmount: '',
    workLocation: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [staffAssigned, setStaffAssigned] = useState<any[]>([]);

  // Data Fetch
  const partnersQuery = useMemoFirebase(() => db ? query(collection(db, 'partners'), where('status', '==', 'active')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), where('status', '==', 'Active')) : null, [db]);
  const staffQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db]);

  const { data: partners } = useCollection(partnersQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: allSubs } = useCollection(subsQuery);
  const { data: employees } = useCollection(staffQuery);

  const selectedPartner = useMemo(() => partners?.find(p => p.id === formData.partnerId), [partners, formData.partnerId]);

  const handleAddStaff = (staffId: string) => {
    const staff = employees?.find(e => e.id === staffId);
    if (!staff || staffAssigned.find(s => s.uid === staffId)) return;
    setStaffAssigned([...staffAssigned, { uid: staff.id, name: staff.name, role: staff.role, salary: 0 }]);
  };

  const updateStaffSalary = (idx: number, val: number) => {
    const next = [...staffAssigned];
    next[idx].salary = val;
    setStaffAssigned(next);
  };

  const removeStaff = (idx: number) => {
    setStaffAssigned(staffAssigned.filter((_, i) => i !== idx));
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.partnerId || !formData.title || !formData.projectAmount) {
      toast({ variant: "destructive", title: "Incomplete Form" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Calculate Commission based on Partner Agreement
      let commissionAmount = 0;
      const amount = parseFloat(formData.projectAmount);
      if (selectedPartner) {
        if (selectedPartner.commissionType === 'percentage') {
          commissionAmount = (amount * selectedPartner.commissionRate) / 100;
        } else {
          commissionAmount = selectedPartner.commissionRate;
        }
      }

      const projectData = {
        ...formData,
        partnerName: selectedPartner?.name || 'Unknown',
        projectAmount: amount,
        commissionAmount,
        commissionDirection: selectedPartner?.commissionDirection || 'TheyGiveMe',
        services: selectedServiceIds,
        addOns: selectedAddOnIds,
        staffAssigned,
        status: 'Pending',
        paidStatus: 'Unpaid',
        schedule: { startDate: formData.startDate, endDate: formData.endDate },
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'partner_projects'), projectData);
      
      // 2. Sync to Ledger for Finance tracking
      await syncProjectToLedger(db, { ...projectData, id: docRef.id });

      toast({ title: "Project Initialized", description: "Ledger entry and staff schedule updated." });
      router.push('/admin/partners/projects');
    } catch (e) {
      toast({ variant: "destructive", title: "Error Creating Project" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">New Partner Project</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Resource & Financial Planning</p>
        </div>
      </div>

      <form onSubmit={handleCreateProject} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Core Definition */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={18} className="text-primary" /> Project Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Partner Company</Label>
                <Select value={formData.partnerId} onValueChange={v => setFormData({...formData, partnerId: v})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                    <SelectValue placeholder="Choose Partner..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.commissionDirection})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Title / Memo</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q1 Office Deep Cleaning - Prime Tech" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Start</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project End (Est)</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Location (Complete Address)</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <Input value={formData.workLocation} onChange={e => setFormData({...formData, workLocation: e.target.value})} placeholder="Full address or multiple locations..." className="h-12 pl-11 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Assignment */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers size={18} className="text-primary" /> Scope Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services?.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                      selectedServiceIds.includes(s.id) ? "border-primary bg-primary/5" : "border-gray-50 bg-white hover:border-primary/20"
                    )}
                  >
                    <span className="font-black text-[10px] uppercase truncate">{s.title}</span>
                    <div className={cn(
                      "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                      selectedServiceIds.includes(s.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                    )}>
                      {selectedServiceIds.includes(s.id) && <Check size={12} strokeWidth={4} />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff & Costs */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-primary" /> Resource Planning
              </CardTitle>
              <Select onValueChange={handleAddStaff}>
                <SelectTrigger className="w-[180px] h-9 rounded-xl font-bold uppercase text-[10px] bg-white">
                  <SelectValue placeholder="+ Assign Staff" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {staffAssigned.map((staff, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <p className="font-black text-xs uppercase text-gray-900">{staff.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{staff.role}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Staff Wage (Est)</Label>
                      <Input 
                        type="number" 
                        value={staff.salary} 
                        onChange={(e) => updateStaffSalary(idx, parseFloat(e.target.value) || 0)} 
                        className="h-9 w-24 bg-white border-none shadow-sm font-black text-xs rounded-xl"
                      />
                    </div>
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeStaff(idx)} className="mt-4 text-destructive hover:bg-red-50 rounded-xl">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {staffAssigned.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-20 flex flex-col items-center gap-3">
                  <Users size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Staff Assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          {/* Financial Summary */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white border-t-8 border-indigo-600">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Project Financials</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary ml-1">Total Project Amount (৳)</Label>
                  <Input 
                    type="number" 
                    value={formData.projectAmount} 
                    onChange={e => setFormData({...formData, projectAmount: e.target.value})} 
                    placeholder="Enter project value" 
                    className="h-14 bg-gray-50 border-none rounded-2xl font-black text-2xl shadow-inner text-indigo-600"
                  />
                </div>

                {selectedPartner && (
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Commission Logic</span>
                      <Badge className="bg-white text-indigo-600 border-none text-[8px] font-black uppercase">
                        {selectedPartner.commissionDirection}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-indigo-400">Rate</p>
                        <p className="text-xl font-black text-indigo-900">{selectedPartner.commissionType === 'percentage' ? `${selectedPartner.commissionRate}%` : `৳${selectedPartner.commissionRate}`}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-indigo-400">Est. Amount</p>
                        <p className="text-3xl font-black text-primary">
                          ৳{((parseFloat(formData.projectAmount) || 0) * (selectedPartner.commissionType === 'percentage' ? selectedPartner.commissionRate / 100 : 1)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <Zap size={20} className="text-amber-600 mt-0.5" />
                  <p className="text-[9px] font-bold text-amber-800 leading-relaxed uppercase">
                    Publishing this project will instantly create an 'Unpaid' entry in your Finance Ledger for tracking.
                  </p>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 md:h-20 rounded-2xl font-black text-2xl bg-[#081621] hover:bg-black text-white uppercase tracking-tight shadow-xl shadow-indigo-600/20 gap-3 active:scale-95 transition-transform"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Deploy Project</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

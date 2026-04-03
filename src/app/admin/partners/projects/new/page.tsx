'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, orderBy, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Wrench, 
  Zap,
  CheckCircle2,
  Building2,
  Layers,
  Check,
  Wallet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syncSourceToLedger } from '@/lib/finance-utils';

export default function NewPartnerProjectPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    partnerId: '',
    title: '',
    projectAmount: '',
    commissionRate: '',
    workLocation: '',
    startDate: '',
    endDate: '',
    notes: '',
    accountId: 'default_cash'
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffAssigned, setStaffAssigned] = useState<any[]>([]);

  // Data Fetch
  const partnersQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'partners'), where('status', '==', 'active')) : null, [db, user]);
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), where('status', '==', 'Active')) : null, [db, user]);
  const staffQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), where('status', '==', 'Active')) : null, [db, user]);
  const accountsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'finance_accounts') : null, [db, user]);

  const { data: partners } = useCollection(partnersQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: employees } = useCollection(staffQuery);
  const { data: accounts } = useCollection(accountsQuery);

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
      const amount = parseFloat(formData.projectAmount);
      const rate = parseFloat(formData.commissionRate) || (selectedPartner?.commissionRate || 0);
      
      let commissionAmount = 0;
      if (selectedPartner?.commissionType === 'percentage') {
        commissionAmount = (amount * rate) / 100;
      } else {
        commissionAmount = rate;
      }

      const projectData = {
        partnerId: formData.partnerId,
        partnerName: selectedPartner?.name || 'Unknown',
        title: formData.title,
        projectAmount: amount,
        commissionRate: rate,
        commissionAmount,
        commissionDirection: selectedPartner?.commissionDirection || 'TheyGiveMe',
        workLocation: formData.workLocation,
        services: selectedServiceIds,
        staffAssigned,
        status: 'Pending',
        paidStatus: 'Unpaid',
        schedule: { startDate: formData.startDate, endDate: formData.endDate },
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'partner_projects'), projectData);
      
      // Finance Sync will happen when status is moved to "Completed" elsewhere,
      // but we can initialize the ledger here if payment was received upfront.
      
      toast({ title: "Project Initialized", description: "B2B project tracking is now active." });
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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">New B2B Project</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Multi-Partner Collaboration Portal</p>
        </div>
      </div>

      <form onSubmit={handleCreateProject} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Core Definition */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={18} className="text-primary" /> Partnership Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Partner</Label>
                <Select value={formData.partnerId} onValueChange={v => setFormData({...formData, partnerId: v})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                    <SelectValue placeholder="Choose existing B2B Partner..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {partners?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Name / Reference</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Samsung Corporate Deep Cleaning" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Project Amount (৳)</Label>
                  <Input type="number" value={formData.projectAmount} onChange={e => setFormData({...formData, projectAmount: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Override Commission ({selectedPartner?.commissionType === 'percentage' ? '%' : '৳'})</Label>
                  <Input type="number" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} placeholder={selectedPartner?.commissionRate?.toString()} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers size={18} className="text-primary" /> Scope & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Schedule Start</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Schedule End</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Work Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <Input value={formData.workLocation} onChange={e => setFormData({...formData, workLocation: e.target.value})} placeholder="Site Address" className="h-12 pl-11 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          {/* Internal Costs Warning */}
          <Card className="border-none shadow-sm bg-blue-50/50 rounded-3xl p-8 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={24} /></div>
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase text-blue-900">Partner Transparency</h4>
                <p className="text-[11px] text-blue-800/70 leading-relaxed font-medium">
                  The partner will only see the **Total Project Amount** and their **Commission**. Your internal costs (Staff salaries, materials, transport) remain confidential and are only tracked in your Master Ledger.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white border-t-8 border-indigo-600">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">Net Calculation</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Gross Project Value</span>
                  <span className="text-gray-900">৳{(parseFloat(formData.projectAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Partner Commission</span>
                  <span className="text-rose-600">-৳{((parseFloat(formData.projectAmount) || 0) * (parseFloat(formData.commissionRate) || selectedPartner?.commissionRate || 0) / 100).toLocaleString()}</span>
                </div>
                <div className="pt-6 border-t-4 border-dashed border-gray-100 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Est. Net Income</p>
                  <p className="text-5xl font-black text-indigo-600 tracking-tighter">
                    ৳{((parseFloat(formData.projectAmount) || 0) - ((parseFloat(formData.projectAmount) || 0) * (parseFloat(formData.commissionRate) || selectedPartner?.commissionRate || 0) / 100)).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Receive Payment To</Label>
                  <Select value={formData.accountId} onValueChange={v => setFormData({...formData, accountId: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} (৳{acc.balance.toLocaleString()})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleCreateProject}
                  disabled={isSubmitting}
                  className="w-full h-16 md:h-20 rounded-2xl font-black text-2xl bg-indigo-600 hover:bg-indigo-700 text-white uppercase tracking-tight shadow-xl shadow-indigo-600/20 gap-3 active:scale-95 transition-transform"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Launch Project</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

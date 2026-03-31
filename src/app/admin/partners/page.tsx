'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Building2, 
  Phone, 
  Mail, 
  Zap, 
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  MoreVertical,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PartnerManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    commissionDirection: 'TheyGiveMe' as 'TheyGiveMe' | 'IGiveThem',
    commissionType: 'percentage' as 'percentage' | 'fixed',
    commissionRate: '',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const partnersQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'partners'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: partners, isLoading } = useCollection(partnersQuery);

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const payload = {
      ...formData,
      commissionRate: parseFloat(formData.commissionRate) || 0,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPartner) {
        await updateDoc(doc(db, 'partners', editingPartner.id), payload);
        toast({ title: "Partner Profile Updated" });
      } else {
        await addDoc(collection(db, 'partners'), { ...payload, createdAt: new Date().toISOString() });
        toast({ title: "Partner Registered" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      commissionDirection: 'TheyGiveMe',
      commissionType: 'percentage',
      commissionRate: '',
      status: 'active',
      notes: ''
    });
    setEditingPartner(null);
  };

  const openEdit = (partner: any) => {
    setEditingPartner(partner);
    setFormData({
      ...partner,
      commissionRate: partner.commissionRate.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this partner profile permanently?")) return;
    await deleteDoc(doc(db, 'partners', id));
    toast({ title: "Partner Removed" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Partner & Companies</h1>
          <p className="text-muted-foreground text-sm font-medium">B2B Commission and Collaboration Management</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 font-bold border-gray-200">
            <Link href="/admin/partners/commissions">Commission Ledger</Link>
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="rounded-xl font-black h-11 px-6 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
            <Plus size={18} /> Register Partner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Partners</p>
              <h3 className="text-3xl font-black">{partners?.length || 0}</h3>
            </div>
            <Building2 size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50 text-emerald-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Income Routes</p>
              <h3 className="text-3xl font-black">{partners?.filter(p => p.commissionDirection === 'TheyGiveMe').length || 0}</h3>
            </div>
            <TrendingUp size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 text-rose-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Expense Routes</p>
              <h3 className="text-3xl font-black">{partners?.filter(p => p.commissionDirection === 'IGiveThem').length || 0}</h3>
            </div>
            <TrendingDown size={40} className="opacity-20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline text-primary" size={32} /></div>
        ) : partners?.map((partner) => (
          <Card key={partner.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100">
            <div className={cn("h-1.5 w-full", partner.commissionDirection === 'TheyGiveMe' ? "bg-emerald-500" : "bg-rose-500")} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:text-primary transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase truncate max-w-[150px]">{partner.name}</h3>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-black border-none uppercase px-2",
                      partner.status === 'active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>{partner.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEdit(partner)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(partner.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><Phone size={12} className="text-primary"/> {partner.phone}</div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><Mail size={12} className="text-primary"/> {partner.email}</div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Protocol</span>
                  <Badge className={cn(
                    "text-[8px] font-black border-none uppercase px-2",
                    partner.commissionDirection === 'TheyGiveMe' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {partner.commissionDirection === 'TheyGiveMe' ? 'Income' : 'Expense'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Rate</span>
                  <span className="text-sm font-black text-gray-900">
                    {partner.commissionType === 'percentage' ? `${partner.commissionRate}%` : `৳${partner.commissionRate}`}
                  </span>
                </div>
              </div>

              <Button variant="ghost" className="w-full h-10 gap-2 font-black uppercase text-[10px] tracking-widest bg-primary/5 text-primary rounded-xl" asChild>
                <Link href={`/admin/partners/commissions?partnerId=${partner.id}`}>
                  Audit Ledger <ChevronRight size={14}/>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-widest">{editingPartner ? 'Update Partner Profile' : 'New Partner Enrollment'}</DialogTitle>
              <DialogDescription className="text-white/40 mt-1 uppercase font-bold text-[10px]">Configure collaboration and commission logic</DialogDescription>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
          </header>
          <form onSubmit={handleSavePartner} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Company/Partner Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Official Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Contact Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Commission Direction</Label>
                  <Select value={formData.commissionDirection} onValueChange={v => setFormData({...formData, commissionDirection: v as any})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="TheyGiveMe" className="text-[10px] font-black uppercase">They Give Me (Income)</SelectItem>
                      <SelectItem value="IGiveThem" className="text-[10px] font-black uppercase">I Give Them (Expense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Rate Type</Label>
                    <Select value={formData.commissionType} onValueChange={v => setFormData({...formData, commissionType: v as any})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="percentage" className="text-[10px] font-black uppercase">Percentage %</SelectItem>
                        <SelectItem value="fixed" className="text-[10px] font-black uppercase">Fixed ৳</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Default Rate</Label>
                    <Input type="number" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Active Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="text-[10px] font-black uppercase">Active Partner</SelectItem>
                      <SelectItem value="inactive" className="text-[10px] font-black uppercase">Inactive / Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase ml-1">Agreement Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Contract terms or internal references..." className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4" />
            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Discard</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl bg-primary text-white uppercase tracking-tighter text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Profile</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CreditCard, 
  Zap, 
  Shield, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  RefreshCw, 
  Users, 
  Clock, 
  Target 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function SubscriptionPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const plansQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'subscription_plans'), orderBy('createdAt', 'asc')) : null, [db]);
  const { data: plans, isLoading } = useCollection(plansQuery);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    period: '/mo',
    frequency: 'Once a week',
    targetAudience: 'Small Families',
    features: '',
    color: 'bg-gray-50',
    icon: 'Zap',
    featured: false
  });

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const planData = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPlan) {
        await updateDoc(doc(db, 'subscription_plans', editingPlan.id), planData);
        toast({ title: "Plan Updated" });
      } else {
        await addDoc(collection(db, 'subscription_plans'), { ...planData, createdAt: new Date().toISOString() });
        toast({ title: "Plan Created" });
      }
      setIsDialogOpen(false);
      setEditingPlan(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!db) return;
    setIsSubmitting(true);
    const defaults = [
      { name: 'Home Basic', price: '৳2,500', period: '/mo', frequency: 'Weekly 1 Visit', targetAudience: 'Small Apartments', features: ['General Cleaning', 'Kitchen Sanitization', 'Bathroom Deep Clean', 'Dusting & Mopping'], color: 'bg-blue-50', icon: 'Zap', featured: false, createdAt: new Date().toISOString() },
      { name: 'Office Premium', price: '৳15,000', period: '/mo', frequency: 'Daily Service', targetAudience: 'Corporate Offices', features: ['Daily Janitorial', 'Pest Control', 'Furniture Polishing', 'Window Cleaning'], color: 'bg-primary/5', featured: true, icon: 'Shield', createdAt: new Date().toISOString() },
      { name: 'Luxury Villa', price: '৳25,000', period: '/mo', frequency: 'Twice a week', targetAudience: 'Large Residences', features: ['Deep Cleaning', 'Garden Maintenance', 'Pool Sanitization', 'Laundry Support'], color: 'bg-amber-50', icon: 'TrendingUp', featured: false, createdAt: new Date().toISOString() }
    ];

    try {
      for (const plan of defaults) {
        await addDoc(collection(db, 'subscription_plans'), plan);
      }
      toast({ title: "Default Packages Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!db || !confirm("Delete this package permanently?")) return;
    await deleteDoc(doc(db, 'subscription_plans', id));
    toast({ title: "Plan Removed" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Billing & Service Plans</h1>
          <p className="text-muted-foreground text-sm font-medium">Configure subscription-based cleaning packages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults} disabled={isSubmitting} className="rounded-xl h-11 gap-2 font-bold border-primary/20 text-primary">
            <RefreshCw size={16} /> Load Defaults
          </Button>
          <Button onClick={() => { setEditingPlan(null); setIsDialogOpen(true); }} className="rounded-xl h-11 px-6 font-black uppercase text-xs shadow-xl gap-2">
            <Plus size={18} /> New Package
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : plans?.map((plan) => (
          <Card key={plan.id} className={cn(
            "relative border-none shadow-sm flex flex-col h-full overflow-hidden transition-all group hover:shadow-2xl hover:-translate-y-1",
            plan.featured && "ring-2 ring-primary shadow-xl scale-105 z-10"
          )}>
            {plan.featured && <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-4 py-1 rounded-bl-2xl">FEATURED</div>}
            
            <CardHeader className={cn("p-8", plan.color)}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-white/50 border-none text-[8px] font-black uppercase tracking-widest px-2 mb-2">Package Tier</Badge>
                  <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">{plan.name}</CardTitle>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-white/50 rounded-full" onClick={() => { setEditingPlan(plan); setFormData({ ...plan, features: plan.features.join(', ') }); setIsDialogOpen(true); }}><Edit size={14}/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-white/50 rounded-full" onClick={() => deletePlan(plan.id)}><Trash2 size={14}/></Button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-bold uppercase">{plan.period}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase flex items-center gap-1">
                    <Clock size={10} /> {plan.frequency}
                  </Badge>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-black uppercase flex items-center gap-1">
                    <Target size={10} /> {plan.targetAudience}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1 bg-white">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Included Services</p>
              <ul className="space-y-4">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <div className="p-0.5 rounded-full bg-green-100 text-green-600 mt-0.5"><Check size={12} strokeWidth={4} /></div>
                    <span className="text-gray-600 font-bold text-xs uppercase tracking-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <form onSubmit={handleSavePlan} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 bg-[#081621] text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-widest">{editingPlan ? 'Update Package' : 'New Service Package'}</DialogTitle>
              <DialogDescription className="text-white/40 font-bold text-[10px] uppercase">Configure billing logic and suitability</DialogDescription>
            </DialogHeader>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Package Title</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Home Basic" required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Suitability / Target</Label>
                  <Input value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} placeholder="e.g. Small Family" required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price Label</Label>
                  <Input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="৳2,500" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Billing Cycle</Label>
                  <Input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="/month" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Service Frequency</Label>
                  <Input value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})} placeholder="e.g. Weekly 1 Visit" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Services Included (Comma separated)</Label>
                <Textarea value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Service 1, Service 2..." className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4" />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase">Highlight Package</Label>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">MARK AS MOST POPULAR TIER</p>
                </div>
                <Switch checked={formData.featured} onCheckedChange={val => setFormData({...formData, featured: val})} />
              </div>
            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 shadow-xl bg-primary text-white uppercase tracking-widest text-xs">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Plan</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

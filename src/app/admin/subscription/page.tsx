
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Zap, Shield, TrendingUp, Plus, Trash2, Edit, Save, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SubscriptionPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingRole] = useState<any>(null);

  const plansQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'subscription_plans'), orderBy('createdAt', 'asc')) : null, [db]);
  const { data: plans, isLoading } = useCollection(plansQuery);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    period: '/mo',
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
      setEditingRole(null);
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
      { name: 'Basic', price: '৳2,500', period: '/mo', features: ['Up to 5 Employees', 'Lead Management', 'Email Support', 'Basic Analytics'], color: 'bg-gray-50', icon: 'Zap', featured: false, createdAt: new Date().toISOString() },
      { name: 'Pro', price: '৳7,500', period: '/mo', features: ['Unlimited Employees', 'AI Chatbot Agent', 'WhatsApp Automation', 'Advanced Reports'], color: 'bg-primary/5', featured: true, icon: 'Shield', createdAt: new Date().toISOString() },
      { name: 'Enterprise', price: 'Custom', period: '', features: ['White-label Branding', 'Custom Lead Gen API', '24/7 Priority Support', 'Dedicated Manager'], color: 'bg-gray-50', icon: 'TrendingUp', featured: false, createdAt: new Date().toISOString() }
    ];

    try {
      for (const plan of defaults) {
        await addDoc(collection(db, 'subscription_plans'), plan);
      }
      toast({ title: "Defaults Initialized" });
    } catch (e) {
      toast({ variant: "destructive", title: "Seed Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!db || !confirm("Delete this plan?")) return;
    await deleteDoc(doc(db, 'subscription_plans', id));
    toast({ title: "Plan Removed" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Billing & Plans</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage SaaS tiers and public pricing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaults} disabled={isSubmitting} className="rounded-xl h-11 gap-2 font-bold border-primary/20 text-primary">
            <RefreshCw size={16} /> Initialize Defaults
          </Button>
          <Button onClick={() => { setEditingRole(null); setIsDialogOpen(true); }} className="rounded-xl h-11 px-6 font-black uppercase text-xs shadow-xl gap-2">
            <Plus size={18} /> New Tier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : plans?.map((plan) => (
          <Card key={plan.id} className={cn(
            "relative border-none shadow-sm flex flex-col h-full overflow-hidden transition-all",
            plan.featured && "ring-2 ring-primary shadow-xl scale-105 z-10"
          )}>
            {plan.featured && <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-lg">POPULAR</div>}
            <CardHeader className={cn("p-8", plan.color)}>
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingRole(plan); setFormData({ ...plan, features: plan.features.join(', ') }); setIsDialogOpen(true); }}><Edit size={14}/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePlan(plan.id)}><Trash2 size={14}/></Button>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-600 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <form onSubmit={handleSavePlan} className="space-y-6">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase">{editingPlan ? 'Edit Tier' : 'New Subscription Tier'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Plan Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Pro Plan" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Price Text</Label>
                  <Input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="৳7,500" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Period</Label>
                  <Input value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} placeholder="/mo" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Features (Comma separated)</Label>
                <Textarea value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Feature 1, Feature 2..." className="min-h-[100px]" />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <Label className="text-xs font-bold">Featured / Highlighted</Label>
                <Switch checked={formData.featured} onCheckedChange={val => setFormData({...formData, featured: val})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Save Tier Config</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

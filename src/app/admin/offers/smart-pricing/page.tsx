'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, setDoc, collection, query, orderBy, deleteDoc, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Loader2, 
  Zap, 
  Clock, 
  Calendar,
  Settings2,
  DollarSign,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SmartPricingPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rulesQuery = useMemoFirebase(() => db ? query(collection(db, 'smart_pricing_rules'), orderBy('priority', 'desc')) : null, [db]);
  const { data: rules, isLoading } = useCollection(rulesQuery);

  const handleAddRule = async () => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'smart_pricing_rules'), {
        name: 'New Pricing Rule',
        type: 'weekend',
        discountPercent: 10,
        isActive: true,
        priority: 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Rule Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    if (!db) return;
    await setDoc(doc(db, 'smart_pricing_rules', id), data, { merge: true });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this pricing rule?")) return;
    await deleteDoc(doc(db, 'smart_pricing_rules', id));
    toast({ title: "Rule Deleted" });
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Smart Pricing Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Dynamic rules for weekend discounts and off-peak incentives</p>
        </div>
        <Button onClick={handleAddRule} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> New Pricing Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {rules?.map((rule) => (
            <Card key={rule.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6 md:p-8 bg-gray-50/50 border-b">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><TrendingUp size={24} /></div>
                    <div className="space-y-1">
                      <Input 
                        defaultValue={rule.name} 
                        onBlur={e => handleUpdate(rule.id, { name: e.target.value })}
                        className="h-8 border-none bg-transparent font-black uppercase text-sm p-0 w-[250px]"
                      />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Dynamic Rule ID: {rule.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={rule.isActive} onCheckedChange={v => handleUpdate(rule.id, { isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="h-9 w-9 text-destructive"><Trash2 size={18} /></Button>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Trigger Type</Label>
                    <Select defaultValue={rule.type} onValueChange={v => handleUpdate(rule.id, { type: v })}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekend">Weekend Pricing</SelectItem>
                        <SelectItem value="off_peak">Off-Peak Hours</SelectItem>
                        <SelectItem value="last_minute">Last Minute Deals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Value (%)</Label>
                    <div className="relative">
                      <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                      <Input 
                        type="number" 
                        defaultValue={rule.discountPercent} 
                        onBlur={e => handleUpdate(rule.id, { discountPercent: parseFloat(e.target.value) || 0 })}
                        className="h-11 pl-10 bg-gray-50 border-none font-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Rule Priority</Label>
                    <Input 
                      type="number" 
                      defaultValue={rule.priority} 
                      onBlur={e => handleUpdate(rule.id, { priority: parseInt(e.target.value) || 0 })}
                      className="h-11 bg-gray-50 border-none font-black"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {rules?.length === 0 && (
            <div className="p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic">
              No smart pricing rules active. Click 'New Pricing Rule' to begin.
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-[#081621] text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-base font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <AlertCircle size={18} /> How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed font-medium">
                The smart pricing engine automatically adjusts checkout prices based on your active rules.
              </p>
              <div className="space-y-4">
                {[
                  "Weekend rules trigger on Fri-Sat",
                  "Off-peak triggers during 10PM - 6AM",
                  "High priority rules override others",
                  "Auto-applied at final payment"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/80">
                    <CheckCircle2 size={14} className="text-primary" /> {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

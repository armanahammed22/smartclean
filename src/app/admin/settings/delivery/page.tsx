
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Truck, 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Save, 
  DollarSign, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function DeliverySettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    label: '',
    amount: 0,
    isEnabled: true
  });

  const deliveryQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'delivery_options'), orderBy('amount', 'asc')) : null, [db]);
  const { data: options, isLoading } = useCollection(deliveryQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.label) return;
    setIsSubmitting(true);

    // Final safety check for NaN before sending to Firestore
    const submissionData = {
      ...formData,
      amount: isNaN(formData.amount) ? 0 : formData.amount
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'delivery_options', editingId), {
          ...submissionData,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Option Updated" });
      } else {
        await addDoc(collection(db, 'delivery_options'), {
          ...submissionData,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Option Created" });
      }
      setFormData({ label: '', amount: 0, isEnabled: true });
      setEditingId(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (opt: any) => {
    setEditingId(opt.id);
    setFormData({
      label: opt.label,
      amount: opt.amount,
      isEnabled: opt.isEnabled
    });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this delivery option?")) return;
    try {
      await deleteDoc(doc(db, 'delivery_options', id));
      toast({ title: "Option Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const toggleEnabled = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'delivery_options', id), { isEnabled: !current });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Delivery Fee Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Configure shipping rates for different zones and services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <Card className="border-none shadow-sm h-fit bg-white rounded-3xl overflow-hidden group border border-gray-100">
          <div className="h-1.5 bg-primary/20 w-full" />
          <CardHeader className="p-8">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              {editingId ? <Edit size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
              {editingId ? 'Edit Rate' : 'Add New Rate'}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Zone-based pricing configuration</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Zone Label</Label>
                <Input 
                  value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})}
                  placeholder="e.g. Inside Dhaka"
                  className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Charge Amount (BDT)</Label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <Input 
                    type="number"
                    value={isNaN(formData.amount) ? "" : formData.amount} 
                    onChange={e => {
                      const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setFormData({...formData, amount: val});
                    }}
                    className="h-12 pl-10 bg-gray-50 border-none rounded-xl font-black text-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <Label className="text-xs font-bold">Enabled</Label>
                <Switch 
                  checked={formData.isEnabled} 
                  onCheckedChange={val => setFormData({...formData, isEnabled: val})} 
                />
              </div>
              <div className="pt-4 flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                  {editingId ? 'Update Rate' : 'Save Rate'}
                </Button>
                {editingId && (
                  <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setFormData({ label: '', amount: 0, isEnabled: true }); }} className="rounded-xl h-12">Cancel</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Active Pricing Models</h2>
            <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[9px]">{options?.length || 0} OPTIONS</Badge>
          </div>

          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-bold uppercase text-[10px]">Syncing Rates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options?.map((opt) => (
                <Card key={opt.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all border border-gray-100">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-sm",
                        opt.isEnabled ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                      )}>
                        <Truck size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm leading-none mb-1">{opt.label}</h4>
                        <p className="text-lg font-black text-primary tracking-tighter">৳{opt.amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Switch checked={opt.isEnabled} onCheckedChange={() => toggleEnabled(opt.id, opt.isEnabled)} />
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => handleEdit(opt)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/5" onClick={() => handleDelete(opt.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!options?.length && !isLoading && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[2.5rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                  <AlertCircle size={40} className="opacity-20" />
                  <p className="font-medium">No delivery charges defined yet. Add your first zone rate.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

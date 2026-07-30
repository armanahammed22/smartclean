
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Award,
  Users,
  Clock,
  Star,
  Zap,
  Palette,
  MoveVertical,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ICONS = {
  Users,
  Star,
  Award,
  Clock,
  Zap,
  TrendingUp: Zap // fallback
};

const COLORS = [
  { name: 'Blue', text: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Emerald', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Rose', text: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'Amber', text: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Indigo', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  { name: 'Purple', text: 'text-purple-600', bg: 'bg-purple-50' }
];

export default function TrustStatsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const statsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'site_stats'), orderBy('order', 'asc')) : null, [db]);
  const { data: stats, isLoading } = useCollection(statsQuery);

  const [formData, setFormData] = useState({
    label: '',
    value: '',
    icon: 'Users',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    order: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.label || !formData.value) return;
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'site_stats', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Statistic Updated" });
      } else {
        await addDoc(collection(db, 'site_stats'), {
          ...formData,
          order: (stats?.length || 0),
          createdAt: new Date().toISOString()
        });
        toast({ title: "Statistic Added" });
      }
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ label: '', value: '', icon: 'Users', color: 'text-blue-600', bg: 'bg-blue-50', order: 0 });
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      label: item.label,
      value: item.value,
      icon: item.icon,
      color: item.color,
      bg: item.bg,
      order: item.order
    });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently remove this statistic?")) return;
    try {
      await deleteDoc(doc(db, 'site_stats', id));
      toast({ title: "Statistic Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Trust Stats Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage the icons and numbers shown in the trust bar section</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM */}
        <div className="lg:col-span-5">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
            <CardHeader className="bg-[#081621] text-white p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                {editingId ? <Edit size={20} className="text-primary"/> : <Plus size={20} className="text-primary"/>}
                {editingId ? 'Modify Statistic' : 'Add New Statistic'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Main Label</Label>
                  <Input 
                    value={formData.label} 
                    onChange={e => setFormData({...formData, label: e.target.value})} 
                    placeholder="e.g. HAPPY CLIENTS" 
                    className="h-12 bg-gray-50 border-none rounded-xl font-bold uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Statistic Value</Label>
                  <Input 
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: e.target.value})} 
                    placeholder="e.g. 15k+" 
                    className="h-12 bg-gray-50 border-none rounded-xl font-black text-lg text-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Icon Category</Label>
                    <Select value={formData.icon} onValueChange={v => setFormData({...formData, icon: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(ICONS).map(icon => (
                          <SelectItem key={icon} value={icon} className="uppercase font-black text-[10px] py-3">{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Sort Order</Label>
                    <Input 
                      type="number" 
                      value={formData.order} 
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      className="h-12 bg-gray-50 border-none rounded-xl font-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Visual Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({...formData, color: c.text, bg: c.bg})}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                          formData.color === c.text ? "border-primary bg-white shadow-md" : "border-transparent bg-gray-50 hover:bg-gray-100"
                        )}
                      >
                        <div className={cn("w-6 h-6 rounded-md", c.bg)} />
                        <span className="text-[8px] font-black uppercase">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-95">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Protocol</>}
                  </Button>
                  {editingId && <Button type="button" variant="ghost" onClick={resetForm} className="h-14 px-6 rounded-2xl">Cancel</Button>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* LIST */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#081621]">Active Trust Matrix</h2>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-3 py-1">{stats?.length || 0} / 6 ACTIVE</Badge>
          </div>

          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.map((item) => {
                const Icon = (ICONS as any)[item.icon] || Zap;
                return (
                  <Card key={item.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-lg transition-all border border-gray-100">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-inner", item.bg, item.color)}>
                          <Icon size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{item.label}</p>
                          <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">{item.value}</h3>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5 rounded-xl" onClick={() => handleEdit(item)}><Edit size={16}/></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(item.id)}><Trash2 size={16}/></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {stats?.length === 0 && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                   <Award size={48} className="opacity-10" />
                   <p className="font-black uppercase text-[10px] tracking-widest">Registry Clear. Build your first stat.</p>
                </div>
              )}
            </div>
          )}

          <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Info size={20}/></div>
                <h4 className="text-sm font-black uppercase text-blue-900">Operational Logic</h4>
             </div>
             <p className="text-[11px] font-medium text-blue-800/70 leading-relaxed uppercase">
                ১. এক লাইনে সর্বোচ্চ ৬টি স্ট্যাটস দেখাবে। <br />
                ২. মোবাইল ডিভাইসে এগুলো অটো-রসপনসিভ হয়ে যাবে। <br />
                ৩. প্রতিটি আইটেমের জন্য আলাদা কালার কোডিং ব্যবহার করতে পারেন।
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

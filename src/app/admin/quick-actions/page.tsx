
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Trash2, 
  Monitor, 
  Laptop, 
  Zap, 
  Loader2,
  Smartphone,
  Cpu,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ICONS: Record<string, any> = {
  Monitor,
  Laptop,
  Zap,
  Smartphone,
  Cpu,
  Layers
};

const GRADIENTS = [
  { name: 'Orange-Red', value: 'from-orange-500 to-red-600' },
  { name: 'Blue-Indigo', value: 'from-blue-500 to-indigo-600' },
  { name: 'Green-Emerald', value: 'from-emerald-500 to-teal-600' },
  { name: 'Purple-Pink', value: 'from-purple-500 to-pink-600' }
];

export default function QuickActionsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ title: '', iconName: 'Monitor', link: '', bgGradient: 'from-orange-500 to-red-600' });

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: actions, isLoading } = useCollection(actionsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.title) return;
    try {
      await addDoc(collection(db, 'quick_actions'), formData);
      setFormData({ title: '', iconName: 'Monitor', link: '', bgGradient: 'from-orange-500 to-red-600' });
      toast({ title: "Action Card Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Action Cards</h1>
          <p className="text-muted-foreground text-sm">Manage the large prominent action cards on the homepage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white">
          <CardHeader><CardTitle className="text-lg font-bold">New Action Card</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. PC Builder" />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.iconName} onValueChange={val => setFormData({...formData, iconName: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ICONS).map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background Gradient</Label>
                <Select value={formData.bgGradient} onValueChange={val => setFormData({...formData, bgGradient: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADIENTS.map(g => <SelectItem key={g.value} value={g.value}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/pc-builder" />
              </div>
              <Button type="submit" className="w-full gap-2 font-bold h-11 shadow-lg"><Plus size={18} /> Create Action</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actions?.map((action) => {
                const Icon = ICONS[action.iconName] || Monitor;
                return (
                  <Card key={action.id} className={`border-none shadow-xl bg-gradient-to-br ${action.bgGradient} text-white group overflow-hidden`}>
                    <CardContent className="p-8 flex items-center justify-between relative">
                      <div className="space-y-4 relative z-10">
                        <Icon size={48} className="opacity-80 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-black uppercase tracking-tight">{action.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => deleteDoc(doc(db!, 'quick_actions', action.id))}>
                        <Trash2 size={20} />
                      </Button>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Icon size={120} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

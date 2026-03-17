
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Zap, Loader2, MousePointer2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const GRADIENTS = [
  { name: 'Green (Primary)', value: 'from-primary to-primary/80' },
  { name: 'Dark Slate', value: 'from-[#081621] to-[#0a253a]' },
  { name: 'Blue-Indigo', value: 'from-blue-500 to-indigo-600' }
];

export default function QuickActionsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ title: '', link: '', bgGradient: 'from-primary to-primary/80' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: actions, isLoading } = useCollection(actionsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.title) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_actions'), formData);
      setFormData({ title: '', link: '', bgGradient: 'from-primary to-primary/80' });
      toast({ title: "Action Card Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this card?")) return;
    await deleteDoc(doc(db, 'quick_actions', id));
    toast({ title: "Card Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Action Highlights</h1>
        <p className="text-muted-foreground text-sm">Manage the primary feature cards on the homepage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-bold">New Highlight Card</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Card Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Expert Deep Clean" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Link</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/services" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Gradient Style</Label>
                <Select value={formData.bgGradient} onValueChange={val => setFormData({...formData, bgGradient: val})}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADIENTS.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        <div className="flex items-center gap-2"><div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", g.value)} />{g.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold"><Plus size={18} /> Create Card</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actions?.map((action) => (
                <Card key={action.id} className={cn(`border-none shadow-xl bg-gradient-to-br ${action.bgGradient} text-white group overflow-hidden relative h-32 rounded-3xl`)}>
                  <CardContent className="p-6 flex flex-col justify-center gap-2 relative z-10 h-full">
                    <MousePointer2 size={24} className="opacity-60" />
                    <h3 className="text-xl font-black uppercase tracking-tight">{action.title}</h3>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white hover:bg-white/20" onClick={() => handleDelete(action.id)}><Trash2 size={16} /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

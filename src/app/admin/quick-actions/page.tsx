
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Layers,
  Wrench,
  Package,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ICONS: Record<string, any> = {
  Monitor,
  Laptop,
  Zap,
  Smartphone,
  Cpu,
  Layers,
  Wrench,
  Package,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Settings
};

const GRADIENTS = [
  { name: 'Primary (Green)', value: 'from-primary to-primary/80' },
  { name: 'Dark Slate', value: 'from-[#081621] to-[#0a253a]' },
  { name: 'Orange-Red', value: 'from-orange-500 to-red-600' },
  { name: 'Blue-Indigo', value: 'from-blue-500 to-indigo-600' },
  { name: 'Green-Emerald', value: 'from-emerald-500 to-teal-600' },
  { name: 'Purple-Pink', value: 'from-purple-500 to-pink-600' }
];

export default function QuickActionsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ title: '', iconName: 'Wrench', link: '', bgGradient: 'from-primary to-primary/80' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionsQuery = useMemoFirebase(() => db ? query(collection(db, 'quick_actions')) : null, [db]);
  const { data: actions, isLoading } = useCollection(actionsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.title) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quick_actions'), formData);
      setFormData({ title: '', iconName: 'Wrench', link: '', bgGradient: 'from-primary to-primary/80' });
      toast({ title: "Action Card Added", description: "The homepage has been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create card." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'quick_actions', id));
    toast({ title: "Card Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Action Cards</h1>
          <p className="text-muted-foreground text-sm">Manage the prominent feature cards on your homepage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">New Feature Card</CardTitle>
            <CardDescription>Add a new shortcut to your home page.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Card Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Pro Services" 
                  className="h-11 bg-gray-50 border-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Icon</Label>
                  <Select value={formData.iconName} onValueChange={val => setFormData({...formData, iconName: val})}>
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ICONS).map(icon => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            {React.createElement(ICONS[icon], { size: 14 })}
                            <span>{icon}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Link</Label>
                  <Input 
                    value={formData.link} 
                    onChange={e => setFormData({...formData, link: e.target.value})} 
                    placeholder="/services" 
                    className="h-11 bg-gray-50 border-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Background Style</Label>
                <Select value={formData.bgGradient} onValueChange={val => setFormData({...formData, bgGradient: val})}>
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENTS.map(g => (
                      <SelectItem key={g.value} value={g.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", g.value)} />
                          <span>{g.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2 font-black h-12 shadow-lg mt-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                Create Action Card
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-bold">Syncing Feature Cards...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {actions?.map((action) => {
                const Icon = ICONS[action.iconName] || Zap;
                return (
                  <Card key={action.id} className={cn(
                    `border-none shadow-xl bg-gradient-to-br ${action.bgGradient} text-white group overflow-hidden relative h-32 flex flex-col items-center justify-center text-center rounded-2xl`
                  )}>
                    <CardContent className="p-6 flex flex-col items-center justify-center gap-3 relative z-10 w-full h-full">
                      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                        <Icon size={32} className="opacity-90" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{action.title}</h3>
                      
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:bg-white/20 h-8 w-8" 
                          onClick={() => handleDelete(action.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150 pointer-events-none">
                      <Icon size={100} />
                    </div>
                  </Card>
                );
              })}
              {!actions?.length && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
                  No custom action cards. Using site defaults.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

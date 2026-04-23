
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Wrench, 
  Zap, 
  Settings2, 
  Loader2, 
  Save, 
  LayoutGrid,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ATTRIBUTE_GROUPS = [
  { id: 'service_team_size', label: 'Team Sizes', desc: 'e.g. 1 Person, 2-4 Persons', icon: Users },
  { id: 'service_duration', label: 'Durations', desc: 'e.g. 1-2 Hours, Full Day', icon: Clock },
  { id: 'service_pricing_type', label: 'Pricing Models', desc: 'e.g. Fixed, Sqft, Quantity', icon: Layers }
];

export default function ServicesAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeGroup, setActiveGroup] = useState(ATTRIBUTE_GROUPS[0].id);
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const attributesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);
  const { data: allAttributes, isLoading } = useCollection(attributesQuery);

  const filteredAttributes = useMemo(() => {
    return allAttributes?.filter(a => a.group === activeGroup) || [];
  }, [allAttributes, activeGroup]);

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newValue.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'master_attributes'), {
        group: activeGroup,
        label: newValue.trim(),
        value: newValue.trim().toLowerCase().replace(/\s+/g, '_'),
        category: 'service',
        createdAt: new Date().toISOString()
      });
      setNewValue('');
      toast({ title: "Attribute Added", description: "Successfully updated the service master table." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this attribute from master table?")) return;
    await deleteDoc(doc(db, 'master_attributes', id));
    toast({ title: "Attribute Removed" });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Service Attribute Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dynamic configuration for all service offerings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          {ATTRIBUTE_GROUPS.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                "w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center gap-4 group",
                activeGroup === group.id 
                  ? "bg-white border-primary shadow-xl" 
                  : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200"
              )}
            >
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                activeGroup === group.id ? "bg-primary text-white" : "bg-gray-200 text-gray-400 group-hover:text-primary"
              )}>
                <group.icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-black uppercase text-xs tracking-tight truncate">{group.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold truncate">{group.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">
                  {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.label} List
                </CardTitle>
              </div>
              <form onSubmit={handleAddAttribute} className="flex gap-2 w-full sm:w-auto">
                <Input 
                  value={newValue} 
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="New value..."
                  className="h-11 bg-white rounded-xl border-gray-200 font-bold"
                />
                <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-black uppercase text-[10px]">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAttributes.map((attr) => (
                    <div key={attr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/40" />
                        <span className="font-black text-[11px] uppercase text-gray-700 tracking-tight">{attr.label}</span>
                      </div>
                      <button onClick={() => handleDelete(attr.id)} className="text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {filteredAttributes.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-20">
                      <Sparkles size={48} className="mx-auto mb-4" />
                      <p className="font-black uppercase tracking-widest text-xs">Registry is empty</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

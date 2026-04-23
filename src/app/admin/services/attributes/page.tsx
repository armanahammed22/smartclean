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
  Sparkles,
  FolderTree,
  X,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ATTRIBUTE_GROUPS = [
  { id: 'service_team_size', label: 'Team Sizes', desc: 'e.g. 1 Person, 2-4 Persons', icon: Users },
  { id: 'service_duration', label: 'Durations', desc: 'e.g. 1-2 Hours, Full Day', icon: Clock },
  { id: 'service_pricing_type', label: 'Pricing Models', desc: 'e.g. Fixed, Sqft, Quantity', icon: Layers }
];

export default function ServicesAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('general');
  const [activeGroup, setActiveGroup] = useState(ATTRIBUTE_GROUPS[0].id);
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Taxonomy Form States
  const [taxonomyLevel, setTaxonomyLevel] = useState<'main' | 'sub'>('main');
  const [taxonomyName, setTaxonomyName] = useState('');
  const [parentId, setParentId] = useState('');

  // Data Queries
  const attributesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);
  const { data: allAttributes, isLoading: attrLoading } = useCollection(attributesQuery);

  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(catsQuery);
  const { data: subcategories } = useCollection(subsQuery);

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
      toast({ title: "Attribute Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTaxonomy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !taxonomyName.trim()) return;
    setIsSubmitting(true);

    const slug = taxonomyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const colName = taxonomyLevel === 'main' ? 'categories' : 'subcategories';
    
    const payload: any = {
      name: taxonomyName.trim(),
      slug,
      order: 0,
      createdAt: new Date().toISOString()
    };

    if (taxonomyLevel === 'sub') payload.categoryId = parentId;

    try {
      await addDoc(collection(db, colName), payload);
      setTaxonomyName('');
      setParentId('');
      toast({ title: `${taxonomyLevel === 'main' ? 'Main' : 'Sub'} Category Added` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (col: string, id: string) => {
    if (!db || !confirm("Delete this record permanently?")) return;
    await deleteDoc(doc(db, col, id));
    toast({ title: "Record Purged" });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Services Attribute Engine</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dynamic configuration and taxonomies for all service offerings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="general" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase">Service Attributes</TabsTrigger>
          <TabsTrigger value="taxonomy" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase">Service Taxonomy</TabsTrigger>
        </TabsList>

        {/* GENERAL ATTRIBUTES TAB */}
        <TabsContent value="general" className="mt-0">
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
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">
                    {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.label} List
                  </CardTitle>
                  <form onSubmit={handleAddAttribute} className="flex gap-2 w-full sm:w-auto">
                    <Input 
                      value={newValue} 
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="Add value..."
                      className="h-11 bg-white rounded-xl border-gray-200 font-bold"
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-black uppercase text-[10px]">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                    </Button>
                  </form>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredAttributes.map((attr) => (
                      <div key={attr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                        <span className="font-black text-[11px] uppercase text-gray-700 tracking-tight">{attr.label}</span>
                        <button onClick={() => handleDelete('master_attributes', attr.id)} className="text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAXONOMY TAB */}
        <TabsContent value="taxonomy" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-24">
                <CardHeader className="bg-[#081621] text-white p-6">
                  <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <FolderTree size={18} className="text-primary" /> Service Taxonomy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hierarchy Level</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                      {(['main', 'sub'] as const).map(l => (
                        <button 
                          key={l}
                          type="button"
                          onClick={() => { setTaxonomyLevel(l); setParentId(''); }}
                          className={cn(
                            "py-2 text-[9px] font-black uppercase rounded-lg transition-all",
                            taxonomyLevel === l ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {l === 'main' ? 'L1 (Main)' : 'L2 (Sub)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddTaxonomy} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category Label</Label>
                      <Input value={taxonomyName} onChange={e => setTaxonomyName(e.target.value)} placeholder="e.g. AC Repair" className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                    </div>

                    {taxonomyLevel === 'sub' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Assign to Main Category</Label>
                        <Select value={parentId} onValueChange={setParentId}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Parent..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" disabled={isSubmitting || (taxonomyLevel === 'sub' && !parentId)} className="w-full h-12 rounded-xl font-black uppercase tracking-tight shadow-xl">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Category"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-4">
              {catsLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : (
                <div className="space-y-4">
                  {categories?.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 px-6 bg-gray-50/50 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-xl text-primary"><LayoutGrid size={18} /></div>
                          <span className="font-black text-gray-900 uppercase text-xs">{cat.name}</span>
                        </div>
                        <button onClick={() => handleDelete('categories', cat.id)} className="text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>

                      <div className="p-4 px-10 space-y-2">
                        {subcategories?.filter(s => s.categoryId === cat.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl group/sub border border-transparent hover:border-gray-200 transition-all">
                            <div className="flex items-center gap-3">
                              <ChevronRight size={12} className="text-gray-300" />
                              <span className="text-[11px] font-bold text-gray-600 uppercase">{sub.name}</span>
                            </div>
                            <button onClick={() => handleDelete('subcategories', sub.id)} className="text-destructive p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity"><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

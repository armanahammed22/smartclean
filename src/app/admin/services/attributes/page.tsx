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
  ChevronRight,
  Edit,
  Activity,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ATTRIBUTE_GROUPS = [
  { id: 'service_team_size', label: 'Team Sizes', desc: 'e.g. 1 Person, 2-4 Persons', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'service_duration', label: 'Durations', desc: 'e.g. 1-2 Hours, Full Day', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'service_pricing_type', label: 'Pricing Models', desc: 'e.g. Fixed, Sqft, Quantity', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' }
];

export default function ServicesAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('general');
  const [activeGroup, setActiveGroup] = useState(ATTRIBUTE_GROUPS[0].id);
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditDialogOpen, setIsEditModalOpen] = useState(false);

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

  // KPIs
  const stats = useMemo(() => {
    return {
      totalL1: categories?.length || 0,
      totalL2: subcategories?.length || 0,
      totalAttrs: allAttributes?.filter(a => a.category === 'service').length || 0
    };
  }, [categories, subcategories, allAttributes]);

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

  const handleEditItem = (item: any, level: 'main' | 'sub' | 'attr') => {
    setEditingItem({ ...item, level });
    setEditValue(item.name || item.label);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!db || !editingItem || !editValue.trim()) return;
    setIsSubmitting(true);
    
    const colName = editingItem.level === 'main' ? 'categories' : editingItem.level === 'sub' ? 'subcategories' : 'master_attributes';
    const field = editingItem.level === 'attr' ? 'label' : 'name';
    const slugField = editingItem.level === 'attr' ? 'value' : 'slug';
    
    const payload: any = {
      [field]: editValue.trim(),
      [slugField]: editValue.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, colName, editingItem.id), payload);
      toast({ title: "Updated Successfully" });
      setIsEditModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
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
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Services Logic Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Control dynamic configuration and taxonomies for all service offerings</p>
        </div>
      </div>

      {/* 📊 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Main Categories (L1)</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalL1}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform shadow-inner"><LayoutGrid size={24}/></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Sub Categories (L2)</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stats.totalL2}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform shadow-inner"><Layers size={24}/></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Active Attributes</p>
              <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.totalAttrs}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform shadow-inner"><Activity size={24}/></div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="general" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Settings2 size={14}/> Service Attributes
          </TabsTrigger>
          <TabsTrigger value="taxonomy" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <FolderTree size={14}/> Service Taxonomy
          </TabsTrigger>
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
                      ? "bg-white border-primary shadow-xl scale-[1.02] z-10" 
                      : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl transition-colors shadow-sm",
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
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white border border-gray-100">
                <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.bg, ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.color)}>
                        {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.icon && React.createElement(ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)!.icon, { size: 20 })}
                    </div>
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">
                        {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.label} List
                    </CardTitle>
                  </div>
                  <form onSubmit={handleAddAttribute} className="flex gap-2 w-full sm:w-auto">
                    <Input 
                      value={newValue} 
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="Add value..."
                      className="h-11 bg-white rounded-xl border-gray-200 font-bold"
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] shadow-lg">
                      {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={18} />}
                    </Button>
                  </form>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredAttributes.map((attr) => (
                      <div key={attr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-md transition-all group">
                        <span className="font-black text-[11px] uppercase text-gray-700 tracking-tight">{attr.label}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditItem(attr, 'attr')} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><Edit size={14}/></button>
                            <button onClick={() => handleDelete('master_attributes', attr.id)} className="text-destructive p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    {filteredAttributes.length === 0 && (
                        <div className="col-span-full py-16 text-center opacity-20">
                            <Sparkles size={40} className="mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">No Values Registered</p>
                        </div>
                    )}
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
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-24 border border-gray-100">
                <CardHeader className="bg-[#081621] text-white p-6">
                  <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <Plus size={18} className="text-primary" /> New Hierarchy Item
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

                    <Button type="submit" disabled={isSubmitting || (taxonomyLevel === 'sub' && !parentId)} className="w-full h-14 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
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
                    <div key={cat.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group">
                      <div className="p-5 px-8 bg-gray-50/50 flex items-center justify-between group-hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner"><LayoutGrid size={20} /></div>
                          <div>
                            <span className="font-black text-gray-900 uppercase text-sm tracking-tight">{cat.name}</span>
                            <p className="text-[9px] font-mono text-muted-foreground">ID: {cat.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 bg-white shadow-sm rounded-xl" onClick={() => handleEditItem(cat, 'main')}><Edit size={16}/></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive bg-white shadow-sm rounded-xl" onClick={() => handleDelete('categories', cat.id)}><Trash2 size={16}/></Button>
                        </div>
                      </div>

                      <div className="p-6 px-10 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subcategories?.filter(s => s.categoryId === cat.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50/30 rounded-2xl group/sub border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <ChevronRight size={14} className="text-primary/40" />
                                    <span className="text-[11px] font-bold text-gray-600 uppercase">{sub.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditItem(sub, 'sub')} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><Edit size={12}/></button>
                                    <button onClick={() => handleDelete('subcategories', sub.id)} className="text-destructive p-1.5 hover:bg-red-50 rounded-lg"><X size={12}/></button>
                                </div>
                            </div>
                            ))}
                            {subcategories?.filter(s => s.categoryId === cat.id).length === 0 && (
                                <div className="col-span-full py-6 text-center border-2 border-dashed rounded-2xl opacity-10">
                                    <p className="text-[10px] font-black uppercase">No Subcategories</p>
                                </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🛠️ EDIT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex justify-between items-center shrink-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black uppercase tracking-widest">Update Record</DialogTitle>
              <p className="text-white/40 font-bold uppercase text-[9px]">Edit the label and associated metadata</p>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </header>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">New Label Name</Label>
              <Input 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                className="h-14 bg-gray-50 border-none rounded-2xl font-black text-lg text-primary shadow-inner" 
                placeholder="Enter new name"
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                    Label পরিবর্তনের ফলে ডাটাবেসে থাকা আগের স্লাগ (Slug) আপডেট হয়ে যাবে এবং এটি সাথে সাথে লাইভ সাইটে রিফ্লেক্ট করবে।
                </p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
             <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Cancel</Button>
             <Button onClick={handleUpdate} disabled={isSubmitting} className="flex-1 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs h-12">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Changes</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

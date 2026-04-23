
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
  Tag, 
  Zap, 
  Settings2, 
  Loader2, 
  Save, 
  LayoutGrid,
  Box,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  ChevronRight,
  Layers,
  Edit,
  Activity,
  X,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ATTRIBUTE_GROUPS = [
  { id: 'product_unit', label: 'Unit Types', desc: 'e.g. Sqft, Piece, KG', icon: Box, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'product_badge', label: 'Badge Texts', desc: 'e.g. NEW, HOT, 20% OFF', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
];

export default function ProductsAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [activeGroup, setActiveGroup] = useState(ATTRIBUTE_GROUPS[0].id);
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditDialogOpen, setIsEditModalOpen] = useState(false);

  // Taxonomy Form States
  const [taxonomyLevel, setTaxonomyLevel] = useState<'main' | 'sub' | 'child'>('main');
  const [taxonomyName, setTaxonomyName] = useState('');
  const [parentId, setParentId] = useState('');

  // Data Queries
  const attributesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);
  const { data: allAttributes, isLoading: attrLoading } = useCollection(attributesQuery);

  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);
  const childsQuery = useMemoFirebase(() => db ? query(collection(db, 'childcategories'), orderBy('name', 'asc')) : null, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(catsQuery);
  const { data: subcategories } = useCollection(subsQuery);
  const { data: childcategories } = useCollection(childsQuery);

  const filteredAttributes = useMemo(() => {
    return allAttributes?.filter(a => a.group === activeGroup) || [];
  }, [allAttributes, activeGroup]);

  // KPIs
  const stats = useMemo(() => {
    return {
      totalL1: categories?.length || 0,
      totalL2: subcategories?.length || 0,
      totalL3: childcategories?.length || 0,
      totalAttrs: allAttributes?.filter(a => a.category === 'product').length || 0
    };
  }, [categories, subcategories, childcategories, allAttributes]);

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newValue.trim()) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'master_attributes'), {
        group: activeGroup,
        label: newValue.trim(),
        value: newValue.trim().toLowerCase().replace(/\s+/g, '_'),
        category: 'product',
        createdAt: new Date().toISOString()
      });
      setNewValue('');
      toast({ title: "Attribute Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Adding Attribute" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = (item: any, level: 'main' | 'sub' | 'child' | 'attr') => {
    setEditingItem({ ...item, level });
    setEditValue(item.name || item.label);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!db || !editingItem || !editValue.trim()) return;
    setIsSubmitting(true);
    
    const colName = editingItem.level === 'main' ? 'categories' 
      : editingItem.level === 'sub' ? 'subcategories' 
      : editingItem.level === 'child' ? 'childcategories'
      : 'master_attributes';

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
    const colName = taxonomyLevel === 'main' ? 'categories' : taxonomyLevel === 'sub' ? 'subcategories' : 'childcategories';
    
    const payload: any = {
      name: taxonomyName.trim(),
      slug,
      order: 0,
      createdAt: new Date().toISOString()
    };

    if (taxonomyLevel === 'sub') payload.categoryId = parentId;
    if (taxonomyLevel === 'child') payload.subcategoryId = parentId;

    try {
      await addDoc(collection(db, colName), payload);
      setTaxonomyName('');
      setParentId('');
      toast({ title: `Level ${taxonomyLevel === 'main' ? '1' : taxonomyLevel === 'sub' ? '2' : '3'} Category Added` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (col: string, id: string) => {
    if (!db || !confirm("Delete this record permanently?")) return;
    await deleteDoc(doc(db, col, id));
    toast({ title: "Removed Successfully" });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Products Configuration Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage master taxonomies and dynamic attributes</p>
        </div>
      </div>

      {/* 📊 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Master (L1)", val: stats.totalL1, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Subs (L2)", val: stats.totalL2, icon: Layers, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Child (L3)", val: stats.totalL3, icon: FolderTree, bg: "bg-purple-50", color: "text-purple-600" },
          { label: "Global Attrs", val: stats.totalAttrs, icon: Activity, bg: "bg-emerald-50", color: "text-emerald-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="general" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">General Attributes</TabsTrigger>
          <TabsTrigger value="taxonomy" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">Category Hierarchy</TabsTrigger>
        </TabsList>

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
                  <div>
                    <p className="font-black uppercase text-xs tracking-tight">{group.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{group.desc}</p>
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
                        {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.label} Registry
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
                            <p className="text-[10px] font-black uppercase">No Registry Found</p>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="taxonomy" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-fit">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-24 border border-gray-100">
                <CardHeader className="bg-[#081621] text-white p-6">
                  <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2">
                    <FolderTree size={18} className="text-primary" /> New Hierarchy Item
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Tier</Label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                      {(['main', 'sub', 'child'] as const).map(l => (
                        <button 
                          key={l}
                          type="button"
                          onClick={() => { setTaxonomyLevel(l); setParentId(''); }}
                          className={cn(
                            "py-2 text-[9px] font-black uppercase rounded-lg transition-all",
                            taxonomyLevel === l ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {l === 'main' ? 'L1' : l === 'sub' ? 'L2' : 'L3'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddTaxonomy} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Label Name</Label>
                      <Input value={taxonomyName} onChange={e => setTaxonomyName(e.target.value)} placeholder="e.g. Smart Phones" className="h-12 bg-gray-50 border-none rounded-xl font-bold" required />
                    </div>

                    {taxonomyLevel !== 'main' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                          {taxonomyLevel === 'sub' ? 'Assign to L1' : 'Assign to L2'}
                        </Label>
                        <Select value={parentId} onValueChange={setParentId}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Parent..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {taxonomyLevel === 'sub' ? (
                              categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                            ) : (
                              subcategories?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({categories?.find(c => c.id === s.categoryId)?.name})</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button type="submit" disabled={isSubmitting || (taxonomyLevel !== 'main' && !parentId)} className="w-full h-14 rounded-xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Taxonomy"}
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
                            <p className="font-black text-gray-900 uppercase text-sm tracking-tight">{cat.name}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">ID: {cat.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 bg-white shadow-sm rounded-xl" onClick={() => handleEditItem(cat, 'main')}><Edit size={16}/></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive bg-white shadow-sm rounded-xl" onClick={() => handleDelete('categories', cat.id)}><Trash2 size={16}/></Button>
                        </div>
                      </div>

                      <div className="p-6 px-10 space-y-3">
                        {subcategories?.filter(s => s.categoryId === cat.id).map(sub => (
                          <div key={sub.id} className="space-y-2">
                            <div className="flex items-center justify-between group/sub bg-gray-50/30 p-3 px-5 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-md transition-all">
                              <div className="flex items-center gap-2">
                                <Layers size={14} className="text-blue-500" />
                                <span className="text-[11px] font-black text-gray-700 uppercase">{sub.name}</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                <button onClick={() => handleEditItem(sub, 'sub')} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><Edit size={12}/></button>
                                <button onClick={() => handleDelete('subcategories', sub.id)} className="text-destructive p-1.5 hover:bg-red-50 rounded-lg"><X size={12}/></button>
                              </div>
                            </div>
                            
                            <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {childcategories?.filter(c => c.subcategoryId === sub.id).map(child => (
                                <div key={child.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-100 group/child hover:shadow-sm transition-all">
                                  <div className="flex items-center gap-3">
                                    <ChevronRight size={10} className="text-gray-300" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{child.name}</span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover/child:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditItem(child, 'child')} className="text-blue-400 p-1 hover:bg-blue-50 rounded-lg"><Edit size={10}/></button>
                                    <button onClick={() => handleDelete('childcategories', child.id)} className="text-destructive p-1 hover:bg-red-50 rounded-lg"><X size={10}/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
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

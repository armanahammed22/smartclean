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
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';

const ATTRIBUTE_GROUPS = [
  { id: 'product_unit', label: 'Unit Types', desc: 'e.g. Sqft, Piece, KG', icon: Box },
  { id: 'product_badge', label: 'Badge Texts', desc: 'e.g. NEW, HOT, 20% OFF', icon: Zap }
];

export default function ProductsAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [activeGroup, setActiveGroup] = useState(ATTRIBUTE_GROUPS[0].id);
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="general" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase">General Attributes</TabsTrigger>
          <TabsTrigger value="taxonomy" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase">Category Hierarchy</TabsTrigger>
        </TabsList>

        {/* TAB 1: GENERAL ATTRIBUTES (Units, Badges) */}
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
                  <div>
                    <p className="font-black uppercase text-xs tracking-tight">{group.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{group.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-[#081621]">
                    {ATTRIBUTE_GROUPS.find(g => g.id === activeGroup)?.label} Registry
                  </CardTitle>
                  <form onSubmit={handleAddAttribute} className="flex gap-2 w-full sm:w-auto">
                    <Input 
                      value={newValue} 
                      onChange={e => setNewValue(e.target.value)}
                      placeholder="Add value..."
                      className="h-11 bg-white rounded-xl border-gray-200 font-bold"
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-6 font-black">
                      {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus size={18} />}
                    </Button>
                  </form>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredAttributes.map((attr) => (
                      <div key={attr.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                        <span className="font-black text-xs uppercase text-gray-700 tracking-tight">{attr.label}</span>
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

        {/* TAB 2: TAXONOMY (L1, L2, L3) */}
        <TabsContent value="taxonomy" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-fit">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-24">
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
                            "py-2 text-[8px] font-black uppercase rounded-lg transition-all",
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

                    <Button type="submit" disabled={isSubmitting || (taxonomyLevel !== 'main' && !parentId)} className="w-full h-12 rounded-xl font-black uppercase tracking-tight shadow-xl">
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
                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 px-6 bg-gray-50/50 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-xl text-primary"><LayoutGrid size={18} /></div>
                          <div>
                            <p className="font-black text-gray-900 uppercase text-xs">{cat.name}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">/{cat.slug}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDelete('categories', cat.id)} className="text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>

                      <div className="p-4 px-8 space-y-3">
                        {subcategories?.filter(s => s.categoryId === cat.id).map(sub => (
                          <div key={sub.id} className="space-y-2">
                            <div className="flex items-center justify-between group/sub bg-gray-50/50 p-2 px-4 rounded-xl">
                              <div className="flex items-center gap-2">
                                <Layers size={14} className="text-blue-500" />
                                <span className="text-[11px] font-black text-gray-700 uppercase">{sub.name}</span>
                              </div>
                              <button onClick={() => handleDelete('subcategories', sub.id)} className="text-destructive p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                            </div>
                            
                            <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {childcategories?.filter(c => c.subcategoryId === sub.id).map(child => (
                                <div key={child.id} className="flex items-center justify-between p-2 px-4 bg-gray-100/30 rounded-lg group/child">
                                  <div className="flex items-center gap-2">
                                    <ChevronRight size={10} className="text-gray-300" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{child.name}</span>
                                  </div>
                                  <button onClick={() => handleDelete('childcategories', child.id)} className="text-destructive p-1 opacity-0 group-hover/child:opacity-100 transition-opacity"><X size={10}/></button>
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
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Tags, 
  ChevronRight, 
  Loader2,
  FolderTree,
  LayoutGrid,
  Layers,
  ArrowRight,
  MoreVertical,
  ChevronDown,
  FolderPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Level = 'main' | 'sub' | 'child';

export default function ProductCategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [activeLevel, setActiveLevel] = useState<Level>('main');
  const [formData, setFormData] = useState({ name: '', parentId: 'none' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);

  // Real-time Collections
  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('order', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('order', 'asc')) : null, [db]);
  const childsQuery = useMemoFirebase(() => db ? query(collection(db, 'childcategories'), orderBy('order', 'asc')) : null, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(catsQuery);
  const { data: subcategories } = useCollection(subsQuery);
  const { data: childcategories } = useCollection(childsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.name.trim()) return;
    setIsSubmitting(true);

    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const colName = activeLevel === 'main' ? 'categories' : activeLevel === 'sub' ? 'subcategories' : 'childcategories';
    
    const payload: any = {
      name: formData.name.trim(),
      slug,
      order: 0,
      createdAt: new Date().toISOString()
    };

    if (activeLevel === 'sub') payload.categoryId = formData.parentId;
    if (activeLevel === 'child') payload.subcategoryId = formData.parentId;

    try {
      await addDoc(collection(db, colName), payload);
      setFormData({ name: '', parentId: 'none' });
      toast({ title: `${activeLevel.toUpperCase()} Category Created` });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (level: Level, id: string) => {
    if (!db || !confirm(`Delete this ${level} category? This may orphan child items.`)) return;
    const colName = level === 'main' ? 'categories' : level === 'sub' ? 'subcategories' : 'childcategories';
    await deleteDoc(doc(db, colName, id));
    toast({ title: "Deleted Successfully" });
  };

  const toggleCat = (id: string) => setExpandedCats(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSub = (id: string) => setExpandedSubs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const isLoading = catsLoading;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Category Hierarchy</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage your 3-level marketplace structure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ADD FORM SECTION */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white sticky top-24">
            <CardHeader className="bg-[#081621] text-white p-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <FolderPlus size={18} className="text-primary" /> New Definition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hierarchy Level</label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                    {(['main', 'sub', 'child'] as Level[]).map(l => (
                      <button 
                        key={l}
                        type="button"
                        onClick={() => { setActiveLevel(l); setFormData({ ...formData, parentId: 'none' }); }}
                        className={cn(
                          "py-2 text-[9px] font-black uppercase rounded-lg transition-all",
                          activeLevel === l ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {l === 'main' ? 'L1' : l === 'sub' ? 'L2' : 'L3'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category Name</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={activeLevel === 'main' ? "e.g. Electronics" : activeLevel === 'sub' ? "e.g. Mobile" : "e.g. Smartphones"}
                    className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                    required
                  />
                </div>

                {activeLevel !== 'main' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                      {activeLevel === 'sub' ? 'Parent Category' : 'Parent Subcategory'}
                    </label>
                    <Select value={formData.parentId} onValueChange={v => setFormData({ ...formData, parentId: v })}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold">
                        <SelectValue placeholder="Select Parent" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLevel === 'sub' ? (
                          categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                        ) : (
                          subcategories?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({categories?.find(c => c.id === s.categoryId)?.name})</SelectItem>)
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting || (activeLevel !== 'main' && formData.parentId === 'none')} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={20} className="mr-2" />}
                  Create {activeLevel}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* TREE VIEW SECTION */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <FolderTree size={16} /> Structure Explorer
            </h2>
            <Badge variant="outline" className="bg-white text-primary border-primary/20 font-black text-[9px] uppercase">{categories?.length || 0} DEPARTMENTS</Badge>
          </div>

          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-bold text-[10px] uppercase">Syncing Taxonomy...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {categories?.map((cat) => (
                <Collapsible key={cat.id} open={expandedCats.includes(cat.id)} onOpenChange={() => toggleCat(cat.id)}>
                  <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white group border border-gray-100">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white shadow-sm border border-gray-100">
                              <ChevronDown size={16} className={cn("transition-transform duration-300", expandedCats.includes(cat.id) ? "" : "-rotate-90")} />
                            </Button>
                          </CollapsibleTrigger>
                          <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><LayoutGrid size={20} /></div>
                          <div>
                            <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight">{cat.name}</h4>
                            <p className="text-[10px] font-mono text-muted-foreground">/{cat.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-[8px] font-black uppercase bg-gray-100 text-gray-500">
                            {subcategories?.filter(s => s.categoryId === cat.id).length || 0} SUBS
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteItem('main', cat.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      <CollapsibleContent className="bg-gray-50/30 border-t border-gray-100 p-4 px-8 space-y-3">
                        {subcategories?.filter(s => s.categoryId === cat.id).map(sub => (
                          <Collapsible key={sub.id} open={expandedSubs.includes(sub.id)} onOpenChange={() => toggleSub(sub.id)}>
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 px-5 group/sub">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <CollapsibleTrigger asChild>
                                    <button className="text-gray-300 hover:text-primary transition-colors">
                                      <ChevronRight size={14} className={cn("transition-transform duration-300", expandedSubs.includes(sub.id) ? "rotate-90" : "")} />
                                    </button>
                                  </CollapsibleTrigger>
                                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Layers size={14} /></div>
                                  <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[7px] font-black bg-blue-50/30 text-blue-400 border-none">
                                    {childcategories?.filter(c => c.subcategoryId === sub.id).length || 0} CHILDS
                                  </Badge>
                                  <button onClick={() => deleteItem('sub', sub.id)} className="text-destructive p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <CollapsibleContent className="mt-3 ml-10 space-y-2 border-l-2 border-dashed border-gray-100 pl-4">
                                {childcategories?.filter(c => c.subcategoryId === sub.id).map(child => (
                                  <div key={child.id} className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-lg border border-transparent hover:border-gray-200 transition-all group/child">
                                    <div className="flex items-center gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                      <span className="text-[11px] font-medium text-gray-600 uppercase">{child.name}</span>
                                    </div>
                                    <button onClick={() => deleteItem('child', child.id)} className="text-destructive p-1 opacity-0 group-hover/child:opacity-100 transition-opacity">
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                ))}
                                {childcategories?.filter(c => c.subcategoryId === sub.id).length === 0 && (
                                  <p className="text-[10px] text-muted-foreground italic pl-4">No terminal categories defined.</p>
                                )}
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                        {subcategories?.filter(s => s.categoryId === cat.id).length === 0 && (
                          <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl text-muted-foreground text-xs italic">
                            Empty branch. Use L2 creation to expand.
                          </div>
                        )}
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

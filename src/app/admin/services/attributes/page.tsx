
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
  Settings2, 
  Loader2, 
  Save, 
  LayoutGrid,
  Layers,
  FolderTree,
  ChevronRight,
  Edit,
  Activity,
  X,
  ShieldCheck,
  Package,
  Search,
  ArrowLeft,
  Home,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ViewLevel = 'category' | 'subcategory' | 'childcategory';

const ATTRIBUTE_GROUPS = [
  { id: 'service_team_size', label: 'Team Sizes', desc: 'e.g. 1 Person, 2-4 Persons', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'service_duration', label: 'Durations', desc: 'e.g. 1-2 Hours, Full Day', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'service_pricing_type', label: 'Pricing Models', desc: 'e.g. Fixed, Sqft, Quantity', icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' }
];

export default function ServicesAttributePage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  // Navigation State
  const [viewLevel, setViewLevel] = useState<ViewLevel>('category');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);

  // General Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formName, setFormName] = useState('');

  // Data Queries
  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);
  const childsQuery = useMemoFirebase(() => db ? query(collection(db, 'childcategories'), orderBy('name', 'asc')) : null, [db]);
  const attributesQuery = useMemoFirebase(() => db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(catsQuery);
  const { data: subcategories, isLoading: subsLoading } = useCollection(subsQuery);
  const { data: childcategories, isLoading: childsLoading } = useCollection(childsQuery);
  const { data: allAttributes, isLoading: attrLoading } = useCollection(attributesQuery);

  // Filtering Logic
  const filteredList = useMemo(() => {
    let base: any[] = [];
    if (viewLevel === 'category') base = categories || [];
    if (viewLevel === 'subcategory') base = subcategories?.filter(s => s.categoryId === selectedCategory?.id) || [];
    if (viewLevel === 'childcategory') base = childcategories?.filter(c => c.subcategoryId === selectedSubCategory?.id) || [];

    if (!searchTerm.trim()) return base;
    return base.filter(item => (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [viewLevel, categories, subcategories, childcategories, selectedCategory, selectedSubCategory, searchTerm]);

  // CRUD Actions
  const handleOpenForm = (item: any = null) => {
    setEditingItem(item);
    setFormName(item ? (item.name || item.label) : '');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formName.trim()) return;
    setIsSubmitting(true);

    const slug = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const colName = viewLevel === 'category' ? 'categories' : viewLevel === 'subcategory' ? 'subcategories' : 'childcategories';
    
    const payload: any = {
      name: formName.trim(),
      slug,
      updatedAt: new Date().toISOString()
    };

    if (!editingItem) {
      payload.createdAt = new Date().toISOString();
      if (viewLevel === 'subcategory') payload.categoryId = selectedCategory.id;
      if (viewLevel === 'childcategory') payload.subcategoryId = selectedSubCategory.id;
    }

    try {
      if (editingItem) {
        await updateDoc(doc(db, colName, editingItem.id), payload);
        toast({ title: "Updated Successfully" });
      } else {
        await addDoc(collection(db, colName), payload);
        toast({ title: "Created Successfully" });
      }
      setIsFormOpen(false);
      setFormName('');
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this record permanently?")) return;
    const colName = viewLevel === 'category' ? 'categories' : viewLevel === 'subcategory' ? 'subcategories' : 'childcategories';
    try {
      await deleteDoc(doc(db, colName, id));
      toast({ title: "Removed Successfully" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  // Hierarchy Navigation
  const navigateToSub = (cat: any) => {
    setSelectedCategory(cat);
    setViewLevel('subcategory');
    setSearchTerm('');
  };

  const navigateToChild = (sub: any) => {
    setSelectedSubCategory(sub);
    setViewLevel('childcategory');
    setSearchTerm('');
  };

  const goBack = () => {
    if (viewLevel === 'childcategory') {
      setViewLevel('subcategory');
      setSelectedSubCategory(null);
    } else if (viewLevel === 'subcategory') {
      setViewLevel('category');
      setSelectedCategory(null);
    }
  };

  const levelLabel = viewLevel === 'category' ? 'Category' : viewLevel === 'subcategory' ? 'Sub-Category' : 'Sub-Child Category';

  return (
    <div className="space-y-8 pb-24 min-w-0">
      {/* 🧭 PREMIUM BREADCRUMBS */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white w-fit px-5 py-2.5 rounded-full border shadow-sm">
          <button onClick={() => { setViewLevel('category'); setSelectedCategory(null); setSelectedSubCategory(null); }} className={cn("hover:text-primary transition-colors", viewLevel === 'category' && "text-primary")}>
            Service Attributes
          </button>
          <ChevronRight size={10} />
          <button onClick={() => { setViewLevel('category'); setSelectedCategory(null); setSelectedSubCategory(null); }} className={cn("hover:text-primary transition-colors", viewLevel === 'category' && "text-primary")}>
            Category
          </button>
          {selectedCategory && (
            <>
              <ChevronRight size={10} />
              <button onClick={() => { setViewLevel('subcategory'); setSelectedSubCategory(null); }} className={cn("hover:text-primary transition-colors", viewLevel === 'subcategory' && "text-primary")}>
                {selectedCategory.name}
              </button>
            </>
          )}
          {selectedSubCategory && (
            <>
              <ChevronRight size={10} />
              <span className="text-primary">{selectedSubCategory.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {viewLevel !== 'category' && (
              <Button variant="ghost" size="icon" onClick={goBack} className="rounded-xl h-11 w-11 bg-white border shadow-sm active:scale-95 transition-all">
                <ArrowLeft size={18} />
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">
                {selectedSubCategory ? selectedSubCategory.name : selectedCategory ? selectedCategory.name : 'Master Categories'}
              </h1>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <FolderTree size={12} className="text-primary"/> Managing {levelLabel} Level
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button onClick={() => handleOpenForm()} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
               <Plus size={18} /> Add {levelLabel}
             </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 📊 LEFT: SEARCH & PARENT INFO */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
             <CardHeader className="bg-gray-50/50 p-6 border-b">
                <CardTitle className="text-sm font-black uppercase">Search & Filter</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    placeholder={`Filter ${levelLabel}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 bg-gray-50 border-none rounded-xl font-medium"
                  />
                </div>
             </CardContent>
          </Card>

          {selectedCategory && (
            <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden">
               <CardHeader className="p-6 pb-2">
                  <p className="text-[9px] font-black uppercase text-primary tracking-widest">Active Context</p>
                  <CardTitle className="text-base font-black uppercase mt-1">Parent Information</CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-3">
                        <span className="text-white/40">MASTER CATEGORY</span>
                        <span className="text-white">{selectedCategory.name}</span>
                     </div>
                     {selectedSubCategory && (
                       <div className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-3">
                          <span className="text-white/40">SUB-CATEGORY</span>
                          <span className="text-white">{selectedSubCategory.name}</span>
                       </div>
                     )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setViewLevel('category')} className="w-full h-10 rounded-xl bg-white/5 border-white/10 text-white font-black uppercase text-[9px] tracking-widest">
                    Switch Parent
                  </Button>
               </CardContent>
            </Card>
          )}

          {/* ATTRIBUTE QUICK ACCESS */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Dynamic Properties</h3>
             {ATTRIBUTE_GROUPS.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", group.bg, group.color)}>
                      <group.icon size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-gray-800">{group.label}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{allAttributes?.filter(a => a.group === group.id).length || 0} Registered</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
             ))}
          </div>
        </div>

        {/* 📋 RIGHT: DATA LIST */}
        <div className="lg:col-span-8 space-y-6">
           {catsLoading || subsLoading || childsLoading ? (
             <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Accessing Registry...</span>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {filteredList.map((item) => (
                 <Card key={item.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-500">
                    <CardContent className="p-6">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                             <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                               {viewLevel === 'category' ? <Package size={20}/> : viewLevel === 'subcategory' ? <Layers size={20}/> : <FolderTree size={20}/>}
                             </div>
                             <div>
                                <h3 className="text-sm font-black uppercase text-[#081621] tracking-tight">{item.name}</h3>
                                <p className="text-[9px] font-mono font-bold text-muted-foreground mt-1">SLUG: /{item.slug}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-primary/5 rounded-lg" onClick={() => handleOpenForm(item)}>
                               <Edit size={14} />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-rose-50 rounded-lg" onClick={() => handleDelete(item.id)}>
                               <Trash2 size={14} />
                             </Button>
                          </div>
                       </div>
                       
                       <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                          {viewLevel !== 'childcategory' ? (
                            <Button variant="ghost" onClick={() => viewLevel === 'category' ? navigateToSub(item) : navigateToChild(item)} className="h-9 px-4 rounded-xl bg-gray-50 hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest gap-2">
                              View {viewLevel === 'category' ? 'Subs' : 'Children'} <ChevronRight size={14}/>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] uppercase px-2 py-0.5">FINAL TIER</Badge>
                          )}
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[8px] font-black uppercase h-5 px-2 border-none">ACTIVE</Badge>
                       </div>
                    </CardContent>
                 </Card>
               ))}
               
               {filteredList.length === 0 && (
                 <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                    <Zap size={48} className="opacity-10" />
                    <div className="space-y-1">
                      <p className="font-black uppercase text-xs tracking-widest">No Records Detected</p>
                      <p className="text-[10px]">Create your first {levelLabel} to begin</p>
                    </div>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>

      {/* 🛠️ CREATE/EDIT DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-primary rounded-2xl shadow-xl"><Settings2 size={24}/></div>
               <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingItem ? 'Edit Protocol' : 'New Assignment'}</DialogTitle>
                  <p className="text-white/40 font-bold uppercase text-[9px] mt-0.5">Modifying {levelLabel}</p>
               </div>
             </div>
          </header>
          <form onSubmit={handleSave} className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Label Name</Label>
                <Input 
                   value={formName} 
                   onChange={e => setFormName(e.target.value)} 
                   placeholder={`e.g. ${viewLevel === 'category' ? 'Home Cleaning' : 'Bathroom Care'}`}
                   className="h-14 bg-gray-50 border-none rounded-2xl font-black text-xl text-primary shadow-inner" 
                   required
                />
             </div>
             
             {viewLevel !== 'category' && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                   <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest leading-none">PARENT CONTEXT</p>
                   <p className="text-xs font-bold text-gray-900 uppercase">
                     {viewLevel === 'subcategory' ? selectedCategory?.name : selectedSubCategory?.name}
                   </p>
                </div>
             )}

             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 mt-1 shrink-0" />
                <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                  সিস্টেম লেভেলে পরিবর্তনের ফলে সংশ্লিষ্ট সব সার্ভিস এর আন্ডারে অটোমেটিক রি-গ্রুপ হবে। 
                </p>
             </div>
          </form>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
             <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="flex-1 h-14 bg-primary hover:bg-[#15435a] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Change"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

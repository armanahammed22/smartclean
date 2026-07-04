
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Loader2, 
  Save, 
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
  Users,
  Grid,
  Settings2,
  CheckCircle2,
  Maximize
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

type ActiveModule = 'hub' | 'category' | 'team_size' | 'duration' | 'pricing_model';
type CategoryLevel = 'main' | 'sub' | 'child';

export default function ServiceAttributesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<ActiveModule>('hub');
  const [catLevel, setCatLevel] = useState<CategoryLevel>('main');
  const [selectedParentCat, setSelectedParentCat] = useState<any>(null);
  const [selectedParentSub, setSelectedParentSub] = useState<any>(null);

  // Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formName, setFormName] = useState('');

  // 1. Data Fetching
  const catsQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subsQuery = useMemoFirebase(() => db ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db]);
  const childsQuery = useMemoFirebase(() => db ? query(collection(db, 'childcategories'), orderBy('name', 'asc')) : null, [db]);
  const attrQuery = useMemoFirebase(() => db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);

  const { data: categories, isLoading: catsLoading } = useCollection(catsQuery);
  const { data: subcategories } = useCollection(subsQuery);
  const { data: childcategories } = useCollection(childsQuery);
  const { data: attributes, isLoading: attrLoading } = useCollection(attrQuery);

  // 2. Computed Lists
  const currentList = useMemo(() => {
    if (activeModule === 'category') {
      if (catLevel === 'main') return categories || [];
      if (catLevel === 'sub') return subcategories?.filter(s => s.categoryId === selectedParentCat?.id) || [];
      if (catLevel === 'child') return childcategories?.filter(c => c.subcategoryId === selectedParentSub?.id) || [];
    }
    
    if (activeModule === 'team_size') return attributes?.filter(a => a.group === 'service_team_size') || [];
    if (activeModule === 'duration') return attributes?.filter(a => a.group === 'service_duration') || [];
    if (activeModule === 'pricing_model') return attributes?.filter(a => a.group === 'service_pricing_type') || [];
    
    return [];
  }, [activeModule, catLevel, categories, subcategories, childcategories, attributes, selectedParentCat, selectedParentSub]);

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return currentList;
    return currentList.filter(item => (item.name || item.label || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [currentList, searchTerm]);

  // 3. Actions
  const handleOpenForm = (item: any = null) => {
    setEditingItem(item);
    setFormName(item ? (item.name || item.label) : '');
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formName.trim()) return;
    setIsSubmitting(true);

    try {
      const slug = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      let colName = '';
      let payload: any = { updatedAt: new Date().toISOString() };

      if (activeModule === 'category') {
        colName = catLevel === 'main' ? 'categories' : catLevel === 'sub' ? 'subcategories' : 'childcategories';
        payload.name = formName.trim();
        payload.slug = slug;
        if (!editingItem) {
            if (catLevel === 'sub') payload.categoryId = selectedParentCat.id;
            if (catLevel === 'child') payload.subcategoryId = selectedParentSub.id;
        }
      } else {
        colName = 'master_attributes';
        payload.label = formName.trim();
        payload.value = slug;
        payload.group = activeModule === 'team_size' ? 'service_team_size' : activeModule === 'duration' ? 'service_duration' : 'service_pricing_type';
        payload.category = 'service';
      }

      if (editingItem) {
        await updateDoc(doc(db, colName, editingItem.id), payload);
        toast({ title: "Update Successful" });
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, colName), payload);
        toast({ title: "Creation Successful" });
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently delete this entry?")) return;
    let colName = 'master_attributes';
    if (activeModule === 'category') {
      colName = catLevel === 'main' ? 'categories' : catLevel === 'sub' ? 'subcategories' : 'childcategories';
    }
    try {
      await deleteDoc(doc(db, colName, id));
      toast({ title: "Entry Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const handleBack = () => {
    if (activeModule === 'category') {
      if (catLevel === 'child') {
        setCatLevel('sub');
        setSelectedParentSub(null);
      } else if (catLevel === 'sub') {
        setCatLevel('main');
        setSelectedParentCat(null);
      } else {
        setActiveModule('hub');
      }
    } else {
      setActiveModule('hub');
    }
  };

  const getModuleTitle = () => {
    if (activeModule === 'category') return catLevel === 'main' ? 'Service Categories' : catLevel === 'sub' ? `Sub Categories: ${selectedParentCat?.name}` : `Child Categories: ${selectedParentSub?.name}`;
    if (activeModule === 'team_size') return 'Team Size Management';
    if (activeModule === 'duration') return 'Service Durations';
    if (activeModule === 'pricing_model') return 'Pricing Models';
    return 'Service Attributes Hub';
  };

  const HUB_CARDS = [
    { id: 'category', label: '📂 Categories', desc: 'Hierarchy (Cat > Sub > Child)', icon: FolderTree, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'team_size', label: '👥 Team Sizes', desc: 'Manage workforce count options', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'duration', label: '⏱ Durations', desc: 'Manage completion time labels', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'pricing_model', label: '💰 Pricing Models', desc: 'Define billing unit logic', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ];

  if (catsLoading || attrLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={48} /><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Booting Logic Hub...</p></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      
      {/* 🧭 PREMIUM NAVIGATION HUB / HEADER */}
      <div className="flex flex-col gap-4">
        {activeModule !== 'hub' && (
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white w-fit px-5 py-2.5 rounded-full border shadow-sm">
            <button onClick={() => setActiveModule('hub')} className="hover:text-primary transition-colors flex items-center gap-2"><Home size={12}/> Hub</button>
            <ChevronRight size={10} />
            <span className="text-primary">{getModuleTitle()}</span>
          </nav>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {activeModule !== 'hub' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl h-11 w-11 bg-white border shadow-sm active:scale-95 transition-all">
                <ArrowLeft size={18} />
              </Button>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">{getModuleTitle()}</h1>
              <p className="text-muted-foreground text-sm font-medium">Enterprise data mapping & operational logic</p>
            </div>
          </div>
          {activeModule !== 'hub' && (
            <Button onClick={() => handleOpenForm()} className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
              <Plus size={18} /> Add Entry
            </Button>
          )}
        </div>
      </div>

      {/* 📂 MODULE VIEW: HUB */}
      {activeModule === 'hub' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
          {HUB_CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveModule(card.id as any)}
              className="flex flex-col items-center justify-center p-10 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-primary hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform"><card.icon size={100}/></div>
              <div className={cn("p-5 rounded-3xl mb-6 shadow-sm group-hover:scale-110 transition-transform", card.bg, card.color)}>
                <card.icon size={36} />
              </div>
              <h3 className="text-lg font-black uppercase text-gray-900 tracking-tight mb-2">{card.label}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">{card.desc}</p>
              <div className="mt-6 p-2 bg-gray-50 rounded-full text-gray-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 📊 MODULE VIEW: DATA LISTS */}
      {activeModule !== 'hub' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search registry..." 
                className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-2xl transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center gap-3 px-6 border-l h-12">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Count: {filteredList.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((item) => (
              <Card key={item.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/5 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                        {activeModule === 'category' ? <FolderTree size={20}/> : activeModule === 'team_size' ? <Users size={20}/> : activeModule === 'duration' ? <Clock size={20}/> : <Layers size={20}/>}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black uppercase text-[#081621] tracking-tight truncate max-w-[150px]">{item.name || item.label}</h3>
                        <p className="text-[9px] font-mono font-bold text-muted-foreground mt-1 uppercase">SLUG: /{item.slug || item.value}</p>
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

                  <div className="pt-5 border-t border-gray-50 flex justify-between items-center">
                    {activeModule === 'category' && catLevel !== 'child' ? (
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          if (catLevel === 'main') {
                            setSelectedParentCat(item);
                            setCatLevel('sub');
                          } else {
                            setSelectedParentSub(item);
                            setCatLevel('child');
                          }
                          setSearchTerm('');
                        }}
                        className="h-9 px-4 rounded-xl bg-gray-50 hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                      >
                        Explore {catLevel === 'main' ? 'Subs' : 'Children'} <ChevronRight size={14}/>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] uppercase px-3 py-1">Registry Verified</Badge>
                    )}
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[8px] font-black uppercase h-6 px-3 border-none flex items-center gap-1"><Check size={10} strokeWidth={4}/> Active</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredList.length === 0 && (
              <div className="col-span-full p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                <Zap size={48} className="opacity-10" />
                <div className="space-y-1">
                  <p className="font-black uppercase text-xs tracking-widest">No Records Detected</p>
                  <p className="text-[10px]">Deploy your first entry to begin managing this module.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🛠️ PROTOCOL EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <header className="p-8 bg-[#081621] text-white flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-primary rounded-2xl shadow-xl"><Settings2 size={24}/></div>
               <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingItem ? 'Update Protocol' : 'New Assignment'}</DialogTitle>
                  <p className="text-white/40 font-bold uppercase text-[9px] mt-0.5">Modifying {activeModule.replace('_', ' ')}</p>
               </div>
             </div>
          </header>
          <form onSubmit={handleSave} className="p-8 space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Label Name</Label>
                <Input 
                   value={formName} 
                   onChange={e => setFormName(e.target.value)} 
                   placeholder="e.g. Home Cleaning, 1 Hour, Per Unit..."
                   className="h-14 bg-gray-50 border-none rounded-2xl font-black text-xl text-primary shadow-inner" 
                   required
                />
             </div>
             
             {activeModule === 'category' && catLevel !== 'main' && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                   <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest leading-none">PARENT CONTEXT</p>
                   <p className="text-xs font-bold text-gray-900 uppercase">
                     {catLevel === 'sub' ? selectedParentCat?.name : selectedParentSub?.name}
                   </p>
                </div>
             )}

             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <ShieldCheck size={18} className="text-blue-600 mt-1 shrink-0" />
                <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                  সিস্টেম লেভেলে পরিবর্তনের ফলে সংশ্লিষ্ট সব সার্ভিস এবং ক্যাটালগ রিয়েল-টাইমে আপডেট হয়ে যাবে।
                </p>
             </div>
          </form>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
             <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
             <Button onClick={handleSave} disabled={isSubmitting} className="flex-1 h-14 bg-primary hover:bg-[#15435a] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Change"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


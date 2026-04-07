
'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Layout, 
  Layers,
  Zap,
  Star,
  Users,
  Palette,
  Type,
  Maximize,
  MousePointer2,
  Grid,
  Settings2,
  Package,
  X,
  AlignLeft,
  AlignCenter,
  Info,
  Filter,
  Navigation,
  Smartphone,
  Monitor,
  Wrench,
  Sparkles,
  CreditCard,
  AlignRight,
  ImageIcon,
  Columns,
  PlusCircle,
  Link as LinkIcon,
  AlignJustify
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Textarea } from '@/components/ui/textarea';

const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout, category: 'Main' },
  { id: 'side_promo', label: 'Side Promo (2 Slots)', icon: Columns, category: 'Main' },
  { id: 'grid_module', label: 'Custom Grid Module', icon: Grid, category: 'Custom' },
  { id: 'top_nav_links', label: 'Top Nav Links', icon: Navigation, category: 'Navigation' },
  { id: 'icon_grid', label: 'Icon Grid', icon: Grid, category: 'Navigation' },
  { id: 'categories', label: 'Categories Grid', icon: Layers, category: 'Navigation' },
  { id: 'flash_deals', label: 'Flash Sale Slider', icon: Zap, category: 'Marketing' },
  { id: 'campaign', label: 'Mega Campaign Banner', icon: Zap, category: 'Marketing' },
  { id: 'section_banners', label: 'Section Banners', icon: ImageIcon, category: 'Marketing' },
  { id: 'feature_cards', label: 'Feature Cards', icon: Zap, category: 'Marketing' },
  { id: 'services_featured', label: 'Main Services', icon: Wrench, category: 'Services' },
  { id: 'sub_services_custom', label: 'Custom Sub-Services', icon: Layers, category: 'Services' },
  { id: 'billing_plans', label: 'Billing & Plans', icon: CreditCard, category: 'Business' },
  { id: 'products_featured', label: 'Featured Products', icon: Star, category: 'Products' },
  { id: 'products_new', label: 'New Arrivals', icon: Package, category: 'Products' },
  { id: 'trust_stats', label: 'Trust Stats Counter', icon: Users, category: 'UI' }
];

export default function HomepageBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localSections, setLocalSections] = useState<any[]>([]);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage_theme') : null, [db]);
  const { data: globalTheme } = useDoc(themeRef);

  const sectionsQuery = useMemoFirebase(() => db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const gridModulesQuery = useMemoFirebase(() => db ? query(collection(db, 'custom_grid_modules'), orderBy('name', 'asc')) : null, [db]);
  const { data: gridModules } = useCollection(gridModulesQuery);

  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  useEffect(() => {
    if (sections) setLocalSections(sections);
  }, [sections]);

  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggedItem(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    const newSections = [...localSections];
    const item = newSections.splice(draggedItem, 1)[0];
    newSections.splice(index, 0, item);
    setLocalSections(newSections);
    setDraggedItem(index);
  };

  const saveOrder = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      localSections.forEach((s, idx) => {
        batch.update(doc(db, 'homepage_sections', s.id), { order: idx });
      });
      await batch.commit();
      toast({ title: "Layout Sequence Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Order Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!db) return;
    const nextVal = !current;
    setLocalSections(prev => prev.map(s => s.id === id ? { ...s, isActive: nextVal } : s));
    await updateDoc(doc(db, 'homepage_sections', id), { isActive: nextVal });
  };

  const handleAddSection = async (type: string) => {
    if (!db) return;
    const typeInfo = SECTION_TYPES.find(t => t.id === type);
    await addDoc(collection(db, 'homepage_sections'), {
      type,
      title: typeInfo?.label || 'New Section',
      isActive: true,
      order: localSections.length,
      config: type === 'grid_module' ? { moduleId: '' } : { limit: 8, dataSource: 'all', category: 'All' },
      createdAt: new Date().toISOString()
    });
    setIsAddOpen(false);
    toast({ title: "Block Added" });
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingSection) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'homepage_sections', editingSection.id), editingSection);
      setIsEditOpen(false);
      toast({ title: "Block Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && localSections.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Homepage Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage dynamic layout sequence and module references</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
            <Plus size={18} /> Add Block
          </Button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl bg-white shadow-sm">
            <Save size={18} /> Save Sequence
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-3">
        {localSections.map((section, index) => {
          const typeInfo = SECTION_TYPES.find(t => t.id === section.type);
          const Icon = typeInfo?.icon || Layout;
          return (
            <Card 
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              className={cn(
                "border-none shadow-sm transition-all duration-300 group bg-white rounded-2xl overflow-hidden",
                !section.isActive && "opacity-50 grayscale",
                draggedItem === index ? "ring-2 ring-primary scale-[1.01] shadow-xl z-50" : "hover:shadow-md border border-gray-100"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg shrink-0"><GripVertical size={20} className="text-gray-300" /></div>
                <div className={cn("p-2.5 rounded-xl shrink-0", section.isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight truncate">{section.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 h-4 border-gray-200">
                      {typeInfo?.label || section.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Label className="text-[8px] font-black uppercase text-gray-400">Live</Label>
                    <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} className="scale-75" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                    <Settings2 size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-lg" onClick={() => { if(confirm("Delete this layout block?")) deleteDoc(doc(db!, 'homepage_sections', section.id)); }}>
                    <Trash2 size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <Settings2 className="text-primary" /> Block Configuration
              </DialogTitle>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60"><X size={24}/></button>
            </div>
          </header>

          <div className="p-8 space-y-8 bg-white">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Heading</Label>
                <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>

              {editingSection?.type === 'grid_module' ? (
                <div className="space-y-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Grid size={20} className="text-blue-600" />
                    <Label className="text-xs font-black uppercase text-blue-900">Select Grid Module</Label>
                  </div>
                  <Select value={editingSection?.config?.moduleId || ''} onValueChange={v => setEditingSection({...editingSection, config: { ...editingSection.config, moduleId: v }})}>
                    <SelectTrigger className="h-12 bg-white border-blue-200 rounded-xl font-bold">
                      <SelectValue placeholder="Choose a reusable grid..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {gridModules?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-blue-700/60 font-medium">Create modules in the dedicated **Grid Builder** page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Limit Items</Label>
                    <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category Filter</Label>
                    <Select value={editingSection?.config?.category || 'All'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, category: v}})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {categories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex gap-3">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="flex-1 font-bold">Discard</Button>
            <Button onClick={handleUpdateSection} disabled={isSubmitting} className="flex-1 rounded-xl font-black h-12 shadow-xl uppercase text-xs">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Logic'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-t-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 md:p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Insert Layout Component</DialogTitle>
            <DialogDescription className="text-white/40 font-bold uppercase text-[9px] tracking-widest mt-1">Select a module to deploy to the homepage sequence</DialogDescription>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white custom-scrollbar">
            {['Main', 'Custom', 'Marketing', 'Services', 'Business', 'Products', 'UI', 'Navigation'].map(category => {
              const categoryTypes = SECTION_TYPES.filter(t => t.category === category);
              if (categoryTypes.length === 0) return null;
              return (
                <div key={category} className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {category} Modules
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {categoryTypes.map((type: any) => (
                      <button 
                        key={type.id} 
                        onClick={() => handleAddSection(type.id)} 
                        className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group active:scale-95 shadow-sm hover:shadow-lg"
                      >
                        <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <type.icon size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-center text-gray-600 group-hover:text-primary tracking-tighter leading-tight">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Layout, 
  Layers,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Users,
  Palette,
  Type,
  Maximize,
  MousePointer2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Award,
  Package,
  X
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

const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout, category: 'Main' },
  { id: 'flash_deals', label: 'Flash Sale Slider', icon: Zap, category: 'Marketing' },
  { id: 'categories', label: 'Categories Grid', icon: Layers, category: 'Navigation' },
  { id: 'campaign', label: 'Mega Campaign Banner', icon: Zap, category: 'Marketing' },
  { id: 'services_featured', label: 'Featured Services', icon: Star, category: 'Services' },
  { id: 'services_popular', label: 'Popular Services', icon: TrendingUp, category: 'Services' },
  { id: 'products_featured', label: 'Featured Products', icon: Star, category: 'Products' },
  { id: 'products_new', label: 'New Arrivals', icon: Package, category: 'Products' },
  { id: 'trust_stats', label: 'Trust Stats Counter', icon: ShieldCheck, category: 'UI' },
  { id: 'testimonials', label: 'Customer Reviews', icon: Users, category: 'UI' }
];

export default function HomepageBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localSections, setLocalSections] = useState<any[]>([]);

  const sectionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

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
      toast({ title: "Layout Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
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
      config: { limit: 8, dataSource: 'all' },
      styleConfig: {
        sectionBg: '#ffffff',
        titleColor: '#081621',
        titleSizeMobile: '24',
        titleSizeDesktop: '40',
        cardBg: '#ffffff',
        cardRadius: '24',
        cardShadow: 'shadow-sm',
        btnBg: '#1E5F7A',
        btnText: '#ffffff',
        btnRadius: '12',
        paddingTop: '40',
        paddingBottom: '40',
        textAlign: 'left'
      },
      createdAt: new Date().toISOString()
    });
    setIsAddOpen(false);
    toast({ title: "Section Added" });
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingSection) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'homepage_sections', editingSection.id), editingSection);
      setIsEditOpen(false);
      toast({ title: "Settings Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStyle = (key: string, val: any) => {
    setEditingSection({
      ...editingSection,
      styleConfig: { ...editingSection.styleConfig, [key]: val }
    });
  };

  if (isLoading && localSections.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Visual Homepage Builder</h1>
          <p className="text-muted-foreground text-sm font-medium">Customize section content and deep design styles</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
            <Plus size={18} /> Add Block
          </Button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl border-primary/20 text-primary">
            <Save size={18} /> Save Order
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 px-1 md:px-0">
        {localSections.map((section, index) => {
          const Icon = SECTION_TYPES.find(t => t.id === section.type)?.icon || Layout;
          return (
            <Card 
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              className={cn(
                "border-none shadow-sm transition-all duration-300 group overflow-hidden",
                !section.isActive && "opacity-50 grayscale",
                draggedItem === index ? "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-xl" : "hover:shadow-md"
              )}
            >
              <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg shrink-0"><GripVertical size={20} className="text-gray-400" /></div>
                <div className={cn("p-2 md:p-2.5 rounded-xl shrink-0", section.isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}><Icon size={20} /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 uppercase text-[10px] md:text-xs tracking-tight truncate">{section.title}</h4>
                  <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{section.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} className="scale-75 md:scale-100" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-blue-600" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-destructive" onClick={() => { if(confirm("Remove?")) deleteDoc(doc(db!, 'homepage_sections', section.id)); }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] rounded-t-[2rem] md:rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="content" className="flex flex-col h-full">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Configure Section</DialogTitle>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <TabsList className="bg-white/10 rounded-xl p-1 h-10 flex-1 sm:flex-none">
                    <TabsTrigger value="content" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Content</TabsTrigger>
                    <TabsTrigger value="styles" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Styles</TabsTrigger>
                  </TabsList>
                  <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
              <TabsContent value="content" className="mt-0 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Title</Label>
                    <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Items Limit</Label>
                      <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Data Source</Label>
                      <Select value={editingSection?.config?.dataSource || 'all'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, dataSource: v}})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Items</SelectItem>
                          <SelectItem value="popular">Popular Only</SelectItem>
                          <SelectItem value="latest">New Arrivals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="styles" className="mt-0 space-y-12 pb-10">
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Container & Text</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Section Background</Label>
                      <Input type="color" value={editingSection?.styleConfig?.sectionBg || '#ffffff'} onChange={e => updateStyle('sectionBg', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Heading Color</Label>
                      <Input type="color" value={editingSection?.styleConfig?.titleColor || '#081621'} onChange={e => updateStyle('titleColor', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Alignment</Label>
                      <Select value={editingSection?.styleConfig?.textAlign || 'left'} onValueChange={v => updateStyle('textAlign', v)}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase">Font Size Mobile ({editingSection?.styleConfig?.titleSizeMobile || 24}px)</Label>
                      <Slider value={[parseInt(editingSection?.styleConfig?.titleSizeMobile || '24')]} min={16} max={48} onValueChange={val => updateStyle('titleSizeMobile', val[0].toString())} />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase">Font Size Desktop ({editingSection?.styleConfig?.titleSizeDesktop || 40}px)</Label>
                      <Slider value={[parseInt(editingSection?.styleConfig?.titleSizeDesktop || '40')]} min={24} max={80} onValueChange={val => updateStyle('titleSizeDesktop', val[0].toString())} />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Card Styling</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Card Background</Label>
                      <Input type="color" value={editingSection?.styleConfig?.cardBg || '#ffffff'} onChange={e => updateStyle('cardBg', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Corner Radius (px)</Label>
                      <Input type="number" value={editingSection?.styleConfig?.cardRadius || 24} onChange={e => updateStyle('cardRadius', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Shadow Depth</Label>
                      <Select value={editingSection?.styleConfig?.cardShadow || 'shadow-sm'} onValueChange={v => updateStyle('cardShadow', v)}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="shadow-none">None</SelectItem>
                          <SelectItem value="shadow-sm">Small</SelectItem>
                          <SelectItem value="shadow-md">Medium</SelectItem>
                          <SelectItem value="shadow-xl">Deep</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><MousePointer2 size={14}/> Button Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Button BG Color</Label>
                      <Input type="color" value={editingSection?.styleConfig?.btnBg || '#1E5F7A'} onChange={e => updateStyle('btnBg', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Button Text Color</Label>
                      <Input type="color" value={editingSection?.styleConfig?.btnText || '#ffffff'} onChange={e => updateStyle('btnText', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Button Shape</Label>
                      <Select value={editingSection?.styleConfig?.btnRadius || '12'} onValueChange={v => updateStyle('btnRadius', v)}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="0">Square</SelectItem>
                          <SelectItem value="12">Rounded</SelectItem>
                          <SelectItem value="999">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-12 rounded-xl">Discard</Button>
              <Button onClick={handleUpdateSection} disabled={isSubmitting} className="w-full sm:w-auto flex-1 rounded-xl font-black px-10 h-12 shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Design'}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-t-[2rem] md:rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 md:p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add Layout Block</DialogTitle>
            <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-1">Select a specialized section for your homepage</DialogDescription>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white custom-scrollbar">
            {['Main', 'Marketing', 'Services', 'Products', 'UI'].map(category => (
              <div key={category} className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {category}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {SECTION_TYPES.filter(t => t.category === category).map((type: any) => (
                    <button 
                      key={type.id} 
                      onClick={() => handleAddSection(type.id)} 
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group relative active:scale-95"
                    >
                      <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <type.icon size={28} />
                      </div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase text-center text-gray-600 group-hover:text-primary tracking-tight leading-tight px-1">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t md:hidden">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="w-full h-12 font-bold uppercase text-xs">Close Selector</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
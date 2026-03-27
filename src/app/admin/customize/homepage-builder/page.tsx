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
  Package
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

  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const { data: services } = useCollection(servicesQuery);

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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
            <Plus size={18} /> Add Block
          </Button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="gap-2 font-black h-11 px-6 rounded-xl border-primary/20 text-primary">
            <Save size={18} /> Save Order
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
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
              <CardContent className="p-4 flex items-center gap-4">
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg"><GripVertical size={20} className="text-gray-400" /></div>
                <div className={cn("p-2.5 rounded-xl", section.isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}><Icon size={20} /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight">{section.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{section.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => { if(confirm("Remove?")) deleteDoc(doc(db!, 'homepage_sections', section.id)); }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="content" className="flex flex-col h-full">
            <header className="p-6 bg-[#081621] text-white shrink-0">
              <div className="flex justify-between items-center mb-6">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Configure Section</DialogTitle>
                <TabsList className="bg-white/10 rounded-xl p-1 h-10">
                  <TabsTrigger value="content" className="text-[10px] font-black uppercase rounded-lg px-4">Content</TabsTrigger>
                  <TabsTrigger value="styles" className="text-[10px] font-black uppercase rounded-lg px-4">Styles (Design)</TabsTrigger>
                </TabsList>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <TabsContent value="content" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Title</Label>
                    <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  {editingSection?.type.includes('featured') ? (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] font-black text-primary uppercase">Filtering: Featured Items Only</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Items Limit</Label>
                        <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Data Source</Label>
                        <Select value={editingSection?.config?.dataSource || 'all'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, dataSource: v}})}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="popular">Popular Only</SelectItem>
                            <SelectItem value="latest">New Arrivals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="styles" className="mt-0 space-y-10">
                {/* Global Section UI */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Container & Text</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                {/* Card Design */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Card Styling</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Card Background</Label>
                      <Input type="color" value={editingSection?.styleConfig?.cardBg || '#ffffff'} onChange={e => updateStyle('cardBg', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Corner Radius (px)</Label>
                      <Input type="number" value={editingSection?.styleConfig?.cardRadius || 24} onChange={e => updateStyle('cardRadius', e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Shadow Depth</Label>
                      <Select value={editingSection?.styleConfig?.cardShadow || 'shadow-sm'} onValueChange={v => updateStyle('cardShadow', v)}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shadow-none">None</SelectItem>
                          <SelectItem value="shadow-sm">Small</SelectItem>
                          <SelectItem value="shadow-md">Medium</SelectItem>
                          <SelectItem value="shadow-xl">Deep</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Button UI */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><MousePointer2 size={14}/> Button Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
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

            <DialogFooter className="p-6 bg-gray-50 border-t shrink-0 flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Discard</Button>
              <Button onClick={handleUpdateSection} disabled={isSubmitting} className="rounded-xl font-black px-10 shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Design'}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ADD BLOCK DIALOG (Unified with Builder) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl custom-scrollbar">
          <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add Layout Block</DialogTitle>
            <DialogDescription className="text-white/40">Select a specialized section for services or products</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-10 bg-white">
            {['Main', 'Marketing', 'Services', 'Products', 'UI'].map(category => (
              <div key={category} className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SECTION_TYPES.filter(t => t.category === category).map((type: any) => (
                    <button key={type.id} onClick={() => handleAddSection(type.id)} className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group">
                      <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors"><type.icon size={24} /></div>
                      <span className="text-[9px] font-black uppercase text-center text-gray-600 group-hover:text-primary tracking-tight leading-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  TrendingUp,
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
  AlignCenter
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

  // Global Theme Hook
  const themeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage_theme') : null, [db]);
  const { data: globalTheme, isLoading: themeLoading } = useDoc(themeRef);

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
      toast({ title: "Layout Sequence Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Order Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveGlobalTheme = async (newData: any) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'site_settings', 'homepage_theme'), newData, { merge: true });
      toast({ title: "Master Styles Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Theme Update Failed" });
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
      styleConfig: { useGlobal: true },
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
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">UI Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage global theme and section logic</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsAddOpen(true)} className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
            <Plus size={18} /> Add Block
          </Button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="flex-1 md:flex-none gap-2 font-black h-11 px-6 rounded-xl bg-white shadow-sm">
            <Save size={18} /> Save Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="builder" className="flex-1 rounded-lg gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">
            <Grid size={14} /> Builder
          </TabsTrigger>
          <TabsTrigger value="master" className="flex-1 rounded-lg gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette size={14} /> Master Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {localSections.map((section, index) => {
              const Icon = SECTION_TYPES.find(t => t.id === section.type)?.icon || Layout;
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
                    <div className={cn("p-2.5 rounded-xl shrink-0", section.isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}><Icon size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight truncate">{section.title}</h4>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">{section.type.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                        <Label className="text-[8px] font-black uppercase text-gray-400">Live</Label>
                        <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} className="scale-75" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                        <Settings2 size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-lg" onClick={() => { if(confirm("Delete this block?")) deleteDoc(doc(db!, 'homepage_sections', section.id)); }}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="master" className="mt-0">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary rounded-xl"><Palette size={24} /></div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-widest leading-none">Global Master Styles</CardTitle>
                    <CardDescription className="text-white/40 mt-1 uppercase font-bold text-[9px]">Universal controls for all homepage sections</CardDescription>
                  </div>
                </div>
                <Button onClick={() => saveGlobalTheme(globalTheme)} className="w-full md:w-auto h-11 px-8 rounded-xl font-black bg-primary">Sync Global Theme</Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-12">
              
              {/* SECTION 1: SECTIONS & FONTS */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                  <Type size={14} /> Typography & Backgrounds
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Section BG</Label>
                    <Input type="color" value={globalTheme?.sectionBg || '#ffffff'} onChange={e => saveGlobalTheme({...globalTheme, sectionBg: e.target.value})} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Section Title Color</Label>
                    <Input type="color" value={globalTheme?.titleColor || '#081621'} onChange={e => saveGlobalTheme({...globalTheme, titleColor: e.target.value})} className="h-10 p-1" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase flex items-center justify-between">Title Size Mobile <span>{globalTheme?.titleSizeMobile || 24}px</span></Label>
                    <Slider value={[parseInt(globalTheme?.titleSizeMobile || '24')]} min={16} max={48} onValueChange={val => saveGlobalTheme({...globalTheme, titleSizeMobile: val[0].toString()})} />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase flex items-center justify-between">Title Size Desktop <span>{globalTheme?.titleSizeDesktop || 40}px</span></Label>
                    <Slider value={[parseInt(globalTheme?.titleSizeDesktop || '40')]} min={24} max={80} onValueChange={val => saveGlobalTheme({...globalTheme, titleSizeDesktop: val[0].toString()})} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CARD GEOMETRY */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                  <Maximize size={14} /> Card & Element Geometry
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Card Background</Label>
                    <Input type="color" value={globalTheme?.cardBg || '#ffffff'} onChange={e => saveGlobalTheme({...globalTheme, cardBg: e.target.value})} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Card Radius (px)</Label>
                    <Input type="number" value={globalTheme?.cardRadius || 24} onChange={e => saveGlobalTheme({...globalTheme, cardRadius: e.target.value})} className="h-10 bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Shadow Depth</Label>
                    <Select value={globalTheme?.cardShadow || 'shadow-sm'} onValueChange={v => saveGlobalTheme({...globalTheme, cardShadow: v})}>
                      <SelectTrigger className="h-10 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shadow-none">No Shadow</SelectItem>
                        <SelectItem value="shadow-sm">Soft Lift</SelectItem>
                        <SelectItem value="shadow-md">Medium Float</SelectItem>
                        <SelectItem value="shadow-xl">Deep Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase">Text Alignment</Label>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                      <button onClick={() => saveGlobalTheme({...globalTheme, textAlign: 'left'})} className={cn("flex-1 h-8 rounded-lg flex items-center justify-center transition-all", (globalTheme?.textAlign || 'left') === 'left' ? "bg-white shadow-sm text-primary" : "text-gray-400")}><AlignLeft size={16}/></button>
                      <button onClick={() => saveGlobalTheme({...globalTheme, textAlign: 'center'})} className={cn("flex-1 h-8 rounded-lg flex items-center justify-center transition-all", globalTheme?.textAlign === 'center' ? "bg-white shadow-sm text-primary" : "text-gray-400")}><AlignCenter size={16}/></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BUTTONS */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                  <MousePointer2 size={14} /> Global Buttons
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Primary Button BG</Label>
                    <Input type="color" value={globalTheme?.btnBg || '#1E5F7A'} onChange={e => saveGlobalTheme({...globalTheme, btnBg: e.target.value})} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Button Text Color</Label>
                    <Input type="color" value={globalTheme?.btnText || '#ffffff'} onChange={e => saveGlobalTheme({...globalTheme, btnText: e.target.value})} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Button Radius (px)</Label>
                    <Input type="number" value={globalTheme?.btnRadius || 12} onChange={e => saveGlobalTheme({...globalTheme, btnRadius: e.target.value})} className="h-10 bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase flex items-center justify-between">Btn Font Size Mobile <span>{globalTheme?.btnFontSizeMobile || 10}px</span></Label>
                    <Slider value={[parseInt(globalTheme?.btnFontSizeMobile || '10')]} min={8} max={20} onValueChange={val => saveGlobalTheme({...globalTheme, btnFontSizeMobile: val[0].toString()})} />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase flex items-center justify-between">Btn Font Size Desktop <span>{globalTheme?.btnFontSizeDesktop || 12}px</span></Label>
                    <Slider value={[parseInt(globalTheme?.btnFontSizeDesktop || '12')]} min={10} max={24} onValueChange={val => saveGlobalTheme({...globalTheme, btnFontSizeDesktop: val[0].toString()})} />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* INDIVIDUAL BLOCK EDITOR MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] rounded-t-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="content" className="flex flex-col h-full">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Settings2 className="text-primary" /> Block Intelligence
                </DialogTitle>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <TabsList className="bg-white/10 rounded-xl p-1 h-10 flex-1 sm:flex-none">
                    <TabsTrigger value="content" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Content</TabsTrigger>
                    <TabsTrigger value="styles" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Styles</TabsTrigger>
                  </TabsList>
                  <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
              <TabsContent value="content" className="mt-0 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Title</Label>
                    <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Items Limit</Label>
                      <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Data Source</Label>
                      <Select value={editingSection?.config?.dataSource || 'all'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, dataSource: v}})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
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

              <TabsContent value="styles" className="mt-0 space-y-10">
                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Maximize size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-blue-900 uppercase">Inherit Master Theme</Label>
                      <p className="text-[10px] text-blue-700/70 font-bold uppercase leading-tight">Sync this block with global marketplace design</p>
                    </div>
                  </div>
                  <Switch 
                    checked={!!editingSection?.styleConfig?.useGlobal} 
                    onCheckedChange={(val) => setEditingSection({...editingSection, styleConfig: {...(editingSection.styleConfig || {}), useGlobal: val}})} 
                  />
                </div>

                {!editingSection?.styleConfig?.useGlobal && (
                  <div className="space-y-12 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Background & Text</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">BG Color</Label>
                            <Input type="color" value={editingSection?.styleConfig?.sectionBg || '#ffffff'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, sectionBg: e.target.value}})} className="h-10 p-1" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Title Color</Label>
                            <Input type="color" value={editingSection?.styleConfig?.titleColor || '#081621'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, titleColor: e.target.value}})} className="h-10 p-1" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Geometry Override</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Radius</Label>
                            <Input type="number" value={editingSection?.styleConfig?.cardRadius || 24} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, cardRadius: e.target.value}})} className="h-10 bg-gray-50 border-none rounded-xl font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Shadow</Label>
                            <Select value={editingSection?.styleConfig?.cardShadow || 'shadow-sm'} onValueChange={v => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, cardShadow: v}})}>
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
                      <div className="space-y-6 md:col-span-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><MousePointer2 size={14}/> Button Logic</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Btn BG</Label>
                            <Input type="color" value={editingSection?.styleConfig?.btnBg || '#1E5F7A'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, btnBg: e.target.value}})} className="h-10 p-1" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Btn Text</Label>
                            <Input type="color" value={editingSection?.styleConfig?.btnText || '#ffffff'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, btnText: e.target.value}})} className="h-10 p-1" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Btn Size Mob (px)</Label>
                            <Input type="number" value={editingSection?.styleConfig?.btnFontSizeMobile || 10} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, btnFontSizeMobile: e.target.value}})} className="h-10" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase">Btn Size Desk (px)</Label>
                            <Input type="number" value={editingSection?.styleConfig?.btnFontSizeDesktop || 12} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, btnFontSizeDesktop: e.target.value}})} className="h-10" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="w-full sm:w-auto h-12 rounded-xl font-bold uppercase text-[10px]">Discard Changes</Button>
              <Button onClick={handleUpdateSection} disabled={isSubmitting} className="w-full sm:w-auto flex-1 rounded-xl font-black px-10 h-12 shadow-xl uppercase text-xs tracking-widest">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Logic'}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-t-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 md:p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add Layout Block</DialogTitle>
            <DialogDescription className="text-white/40 font-bold uppercase text-[9px] tracking-widest mt-1">Select a module to insert into the sequence</DialogDescription>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white custom-scrollbar">
            {['Main', 'Marketing', 'Services', 'Products', 'UI'].map(category => (
              <div key={category} className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {category} Modules
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {SECTION_TYPES.filter(t => t.category === category).map((type: any) => (
                    <button 
                      key={type.id} 
                      onClick={() => handleAddSection(type.id)} 
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group relative active:scale-95 shadow-sm hover:shadow-lg"
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
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

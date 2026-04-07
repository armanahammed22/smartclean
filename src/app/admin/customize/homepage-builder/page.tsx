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

/**
 * STRICT ALLOWED SECTION TYPES
 */
const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout, category: 'Main' },
  { id: 'side_promo', label: 'Side Promo (2 Slots)', icon: Columns, category: 'Main' },
  { id: 'custom_grid', label: 'Dynamic Grid Builder', icon: Grid, category: 'Custom' },
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

  const sectionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

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

  const updateGlobalTheme = async (newData: any) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'site_settings', 'homepage_theme'), newData, { merge: true });
    } catch (e) {
      console.error('Theme sync failed', e);
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
      items: type === 'custom_grid' ? [] : null,
      config: { limit: 8, dataSource: 'all', category: 'All' },
      styleConfig: { 
        useGlobal: true,
        paddingY: 40,
        gridShow: '4',
        columnsMobile: '2',
        columnsTablet: '3',
        columnsDesktop: '4',
        gap: 16,
        cardHeight: 'auto',
        imgHeight: 200,
        cardRadius: 24,
        showShadow: true,
        cardBg: '#ffffff',
        textAlign: 'left',
        titleAlign: 'left',
        priceAlign: 'left',
        btnAlign: 'full',
        btnText: 'Book Now',
        btnSize: 'default',
        btnType: 'default'
      },
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

  const addGridItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Card',
      desc: 'Short description here...',
      price: '',
      imageUrl: '',
      btnText: 'Action',
      btnLink: '#',
      badge: '',
      isActive: true
    };
    setEditingSection({
      ...editingSection,
      items: [...(editingSection.items || []), newItem]
    });
  };

  const updateGridItem = (id: string, field: string, val: any) => {
    const nextItems = editingSection.items.map((item: any) => 
      item.id === id ? { ...item, [field]: val } : item
    );
    setEditingSection({ ...editingSection, items: nextItems });
  };

  const removeGridItem = (id: string) => {
    setEditingSection({
      ...editingSection,
      items: editingSection.items.filter((item: any) => item.id !== id)
    });
  };

  if (isLoading && localSections.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Homepage Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage dynamic layout, visibility and global styling rules</p>
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

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md shadow-sm">
          <TabsTrigger value="builder" className="flex-1 rounded-lg gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">
            <Grid size={14} /> Section Builder
          </TabsTrigger>
          <TabsTrigger value="master" className="flex-1 rounded-lg gap-2 font-bold uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette size={14} /> Master Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-0">
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
                        {section.items?.length > 0 && (
                          <Badge className="bg-amber-50 text-amber-600 border-none text-[7px] font-black h-4 px-1.5">{section.items.length} Custom Cards</Badge>
                        )}
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
        </TabsContent>

        <TabsContent value="master">
          {/* Master theme content remains the same as previous implementation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-xl"><Palette size={24} /></div>
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-widest leading-none">Global Branding Styles</CardTitle>
                      <CardDescription className="text-white/40 mt-1 uppercase font-bold text-[9px]">Universal controls for all homepage sections</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-12">
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                        <Maximize size={14} /> Geometric Logic
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Section Background</Label>
                          <Input type="color" value={globalTheme?.sectionBg || '#ffffff'} onChange={e => updateGlobalTheme({ sectionBg: e.target.value })} className="h-10 p-1 bg-white border-gray-100 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Card Background</Label>
                          <Input type="color" value={globalTheme?.cardBg || '#ffffff'} onChange={e => updateGlobalTheme({ cardBg: e.target.value })} className="h-10 p-1 bg-white border-gray-100 rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Card Radius (px)</Label>
                          <Input type="number" value={globalTheme?.cardRadius || 24} onChange={e => updateGlobalTheme({ cardRadius: parseInt(e.target.value) || 0 })} className="h-10 bg-gray-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Shadow Style</Label>
                          <Select value={globalTheme?.cardShadow || 'shadow-sm'} onValueChange={v => updateGlobalTheme({ cardShadow: v })}>
                            <SelectTrigger className="h-10 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
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
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] rounded-t-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="content" className="flex flex-col h-full">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Settings2 className="text-primary" /> {editingSection?.type === 'custom_grid' ? 'Grid Builder' : 'Block Calibration'}
                </DialogTitle>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <TabsList className="bg-white/10 rounded-xl p-1 h-10 flex-1 sm:flex-none">
                    <TabsTrigger value="content" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Content</TabsTrigger>
                    <TabsTrigger value="styles" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Styles</TabsTrigger>
                    {editingSection?.type === 'custom_grid' && <TabsTrigger value="items" className="flex-1 sm:flex-none text-[10px] font-black uppercase rounded-lg px-4">Manage Cards</TabsTrigger>}
                  </TabsList>
                  <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
              <TabsContent value="content" className="mt-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Heading</Label>
                      <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    {editingSection?.type !== 'custom_grid' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Max Items</Label>
                          <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category Filter</Label>
                          <Select value={editingSection?.config?.category || 'All'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, category: v}})}>
                            <SelectTrigger className="h-12 bg-gray-50"><SelectValue /></SelectTrigger>
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
              </TabsContent>

              <TabsContent value="styles" className="mt-0 space-y-10">
                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><Maximize size={24} /></div>
                    <div className="space-y-1">
                      <Label className="text-sm font-black text-blue-900 uppercase">Inherit Master Theme</Label>
                      <p className="text-[10px] text-blue-700/70 font-bold uppercase leading-tight">Sync this block with global system branding</p>
                    </div>
                  </div>
                  <Switch 
                    checked={!!editingSection?.styleConfig?.useGlobal} 
                    onCheckedChange={(val) => setEditingSection({...editingSection, styleConfig: {...(editingSection.styleConfig || { useGlobal: true }), useGlobal: val}})} 
                  />
                </div>

                {!editingSection?.styleConfig?.useGlobal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-top-4">
                    {/* Grid Logic */}
                    <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Grid size={14}/> Layout & Spacing</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Mobile Cols</Label>
                          <Input type="number" value={editingSection?.styleConfig?.columnsMobile || 2} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, columnsMobile: e.target.value}})} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Tablet Cols</Label>
                          <Input type="number" value={editingSection?.styleConfig?.columnsTablet || 3} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, columnsTablet: e.target.value}})} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Desktop Cols</Label>
                          <Input type="number" value={editingSection?.styleConfig?.columnsDesktop || 4} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, columnsDesktop: e.target.value}})} className="h-10 bg-gray-50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Gap (px)</Label>
                        <Input type="number" value={editingSection?.styleConfig?.gap || 16} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, gap: parseInt(e.target.value)}})} className="h-10 bg-gray-50" />
                      </div>
                    </div>

                    {/* Card Design */}
                    <div className="space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Card Aesthetics</h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Card Min Height (px)</Label>
                          <Input value={editingSection?.styleConfig?.cardHeight || 'auto'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, cardHeight: e.target.value}})} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Image Height (px)</Label>
                          <Input type="number" value={editingSection?.styleConfig?.imgHeight || 200} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, imgHeight: parseInt(e.target.value)}})} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Border Radius (px)</Label>
                          <Input type="number" value={editingSection?.styleConfig?.cardRadius || 24} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, cardRadius: parseInt(e.target.value)}})} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Card Background</Label>
                          <Input type="color" value={editingSection?.styleConfig?.cardBg || '#ffffff'} onChange={e => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, cardBg: e.target.value}})} className="h-10 p-1" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <Label className="text-[10px] font-black uppercase">Show Drop Shadow</Label>
                        <Switch checked={editingSection?.styleConfig?.showShadow} onCheckedChange={v => setEditingSection({...editingSection, styleConfig: {...editingSection.styleConfig, showShadow: v}})} />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {editingSection?.type === 'custom_grid' && (
                <TabsContent value="items" className="mt-0 space-y-8">
                  <div className="flex justify-between items-center px-1">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#081621]">Grid Items ({editingSection.items?.length || 0})</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Create custom cards for this section</p>
                    </div>
                    <Button onClick={addGridItem} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] gap-2 shadow-lg">
                      <PlusCircle size={16} /> Add Custom Card
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {editingSection.items?.map((item: any, idx: number) => (
                      <Card key={item.id} className="border-none shadow-sm bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100 group">
                        <CardContent className="p-0">
                          <div className="flex flex-col lg:flex-row">
                            {/* Card Media */}
                            <div className="lg:w-64 p-6 bg-white border-r border-gray-100">
                              <ImageUploader 
                                initialUrl={item.imageUrl} 
                                label="Card Image"
                                onUpload={url => updateGridItem(item.id, 'imageUrl', url)} 
                                aspectRatio="aspect-square"
                              />
                            </div>
                            {/* Card Content */}
                            <div className="flex-1 p-6 md:p-8 space-y-6">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">Card Title</Label>
                                      <Input value={item.title} onChange={e => updateGridItem(item.id, 'title', e.target.value)} className="h-10 bg-white border-none rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[9px] font-black uppercase">Badge (Optional)</Label>
                                      <Input value={item.badge} onChange={e => updateGridItem(item.id, 'badge', e.target.value)} placeholder="e.g. New" className="h-10 bg-white border-none rounded-xl font-black text-primary uppercase text-[9px]" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase">Short Description</Label>
                                    <Textarea value={item.desc} onChange={e => updateGridItem(item.id, 'desc', e.target.value)} className="min-h-[80px] bg-white border-none rounded-xl text-xs" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  <button onClick={() => removeGridItem(item.id)} className="p-2 text-destructive hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                                    <Label className="text-[8px] font-black">LIVE</Label>
                                    <Switch checked={item.isActive} onCheckedChange={v => updateGridItem(item.id, 'isActive', v)} className="scale-75" />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase">Price (Optional)</Label>
                                  <Input value={item.price} onChange={e => updateGridItem(item.id, 'price', e.target.value)} placeholder="e.g. 500" className="h-10 bg-white border-none rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase">Button Text</Label>
                                  <Input value={item.btnText} onChange={e => updateGridItem(item.id, 'btnText', e.target.value)} className="h-10 bg-white border-none rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase">Button Link</Label>
                                  <Input value={item.btnLink} onChange={e => updateGridItem(item.id, 'btnLink', e.target.value)} className="h-10 bg-white border-none rounded-xl font-mono text-[10px]" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!editingSection.items || editingSection.items.length === 0) && (
                      <div className="p-20 text-center border-2 border-dashed rounded-[3rem] bg-gray-50/50 text-muted-foreground italic flex flex-col items-center gap-4">
                        <Sparkles size={40} className="text-gray-200" />
                        <p className="text-xs font-black uppercase">No Cards Added Yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="w-full sm:auto h-12 rounded-xl font-bold uppercase text-[10px]">Discard</Button>
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
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Insert Layout Component</DialogTitle>
            <DialogDescription className="text-white/40 font-bold uppercase text-[9px] tracking-widest mt-1">Select an allowed module to deploy to the homepage sequence</DialogDescription>
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
                        className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group relative active:scale-95 shadow-sm hover:shadow-lg"
                      >
                        <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <type.icon size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase text-center text-gray-600 group-hover:text-primary tracking-tighter leading-tight">
                          {type.label}
                        </span>
                        <Badge variant="outline" className="text-[7px] font-bold uppercase border-gray-200 text-gray-400 px-1.5 h-4 group-hover:border-primary/20 group-hover:text-primary/60">{type.category}</Badge>
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
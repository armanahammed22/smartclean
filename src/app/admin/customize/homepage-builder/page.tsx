
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, setDoc, serverTimestamp } from 'firebase/firestore';
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
  Navigation,
  Wrench,
  ImageIcon,
  PlusCircle,
  Database,
  Columns
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

const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout, category: 'Main' },
  { id: 'side_promo', label: 'Side Promo (2 Slots)', icon: Columns, category: 'Main' },
  { id: 'top_nav_links', label: 'Top Nav Links', icon: Navigation, category: 'Navigation' },
  { id: 'icon_grid', label: 'Icon Grid', icon: Grid, category: 'Navigation' },
  { id: 'categories', label: 'Categories Grid', icon: Layers, category: 'Navigation' },
  { id: 'flash_deals', label: 'Flash Sale Slider', icon: Zap, category: 'Marketing' },
  { id: 'campaign', label: 'Mega Campaign Banner', icon: Zap, category: 'Marketing' },
  { id: 'section_banners', label: 'Section Banners', icon: ImageIcon, category: 'Marketing' },
  { id: 'feature_cards', label: 'Feature Cards', icon: Zap, category: 'Marketing' },
  { id: 'services_featured', label: 'Main Services', icon: Wrench, category: 'Services' },
  { id: 'sub_services_custom', label: 'Custom Sub-Services', icon: Layers, category: 'Services' },
  { id: 'products_featured', label: 'Featured Products', icon: Star, category: 'Products' },
  { id: 'products_new', label: 'New Arrivals', icon: Package, category: 'Products' },
  { id: 'trust_stats', label: 'Trust Stats Counter', icon: Users, category: 'UI' }
];

const DEFAULT_CARD_STYLE = {
  cardBg: '#ffffff',
  titleColor: '#1f2937',
  priceColor: '#1E5F7A',
  cardRadius: 24,
  showShadow: true,
  textAlign: 'left',
  btnBg: '#1E5F7A',
  btnTextColor: '#ffffff',
  btnSize: 'sm',
  titleSize: 'text-sm',
  priceSize: 'text-lg'
};

export default function HomepageBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localSections, setLocalSections] = useState<any[]>([]);

  // 🎨 Global Card Style State
  const stylesRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'card_styles') : null, [db]);
  const { data: globalStyles, isLoading: stylesLoading } = useDoc(stylesRef);
  const [localStyles, setLocalStyles] = useState<any>({
    productCard: DEFAULT_CARD_STYLE,
    serviceCard: DEFAULT_CARD_STYLE
  });

  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const sectionsQuery = useMemoFirebase(() => db ? query(sectionsRef!, orderBy('order', 'asc')) : null, [db, sectionsRef]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('order', 'asc')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  useEffect(() => {
    if (sections) setLocalSections(sections);
  }, [sections]);

  useEffect(() => {
    if (globalStyles) {
      setLocalStyles({
        productCard: { ...DEFAULT_CARD_STYLE, ...(globalStyles.productCard || {}) },
        serviceCard: { ...DEFAULT_CARD_STYLE, ...(globalStyles.serviceCard || {}) }
      });
    }
  }, [globalStyles]);

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

  const handleAddSection = async (type: string) => {
    if (!db) return;
    const typeInfo = SECTION_TYPES.find(t => t.id === type);
    await addDoc(collection(db, 'homepage_sections'), {
      type,
      title: typeInfo?.label || 'New Section',
      isActive: true,
      order: localSections.length,
      config: {
        limit: 8,
        titleColor: '#081621',
        titleSizeMobile: 'text-2xl',
        titleSizeDesktop: 'text-5xl',
        titleAlign: 'left',
        gridColsMobile: '2',
        gridColsTablet: '3',
        gridColsDesktop: '5'
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

  const handleSaveGlobalStyles = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'card_styles'), {
        ...localStyles,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Global Card Styles Published", description: "All cards updated across the site." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateCardStyle = (type: 'productCard' | 'serviceCard', field: string, val: any) => {
    setLocalStyles({
      ...localStyles,
      [type]: { ...localStyles[type], [field]: val }
    });
  };

  if (isLoading && localSections.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Homepage Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage layout sequence and global component aesthetics</p>
        </div>
      </div>

      <Tabs defaultValue="sequence" className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-xl">
          <TabsTrigger value="sequence" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Navigation size={14}/> Layout Sequence
          </TabsTrigger>
          <TabsTrigger value="styles" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Palette size={14}/> Global Card Styles
          </TabsTrigger>
        </TabsList>

        {/* 📋 LAYOUT SEQUENCE TAB */}
        <TabsContent value="sequence" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
              <Plus size={18} /> Add Section Block
            </Button>
            <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="gap-2 font-black h-11 px-6 rounded-xl bg-white shadow-sm">
              <Save size={18} /> Sync Sequence
            </Button>
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
                      <Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 h-4 border-gray-200">
                        {typeInfo?.label || section.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <Label className="text-[8px] font-black uppercase text-gray-400">Live</Label>
                        <Switch checked={section.isActive} onCheckedChange={(val) => {
                          const next = localSections.map(s => s.id === section.id ? { ...s, isActive: val } : s);
                          setLocalSections(next);
                          updateDoc(doc(db!, 'homepage_sections', section.id), { isActive: val });
                        }} className="scale-75" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                        <Settings2 size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50 rounded-lg" onClick={() => { if(confirm("Delete block?")) deleteDoc(doc(db!, 'homepage_sections', section.id)); }}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 🎨 GLOBAL STYLES TAB */}
        <TabsContent value="styles" className="space-y-8">
          <div className="flex justify-end">
            <Button onClick={handleSaveGlobalStyles} disabled={isSubmitting} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Global Designs
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PRODUCT CARD STYLING */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Package className="text-primary" /> Product Card Style
                </CardTitle>
                <CardDescription className="text-white/40 font-bold uppercase text-[9px]">Applied to all product items automatically</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <CardStyleForm type="productCard" styles={localStyles.productCard} onChange={updateCardStyle} />
              </CardContent>
            </Card>

            {/* SERVICE CARD STYLING */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-[#081621] text-white p-8">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <Wrench className="text-primary" /> Service Card Style
                </CardTitle>
                <CardDescription className="text-white/40 font-bold uppercase text-[9px]">Applied to all services & sub-services automatically</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <CardStyleForm type="serviceCard" styles={localStyles.serviceCard} onChange={updateCardStyle} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🛠️ BLOCK SETTINGS DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <header className="p-8 bg-[#081621] text-white shrink-0">
            <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <Settings2 className="text-primary" /> Section Parameters
            </DialogTitle>
          </header>
          <div className="p-8 space-y-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Heading</Label>
              <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Max Items</Label>
                <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Heading Align</Label>
                <Select value={editingSection?.config?.titleAlign || 'left'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, titleAlign: v}})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="flex-1 font-bold">Discard</Button>
            <Button onClick={handleUpdateSection} disabled={isSubmitting} className="flex-1 rounded-xl font-black h-12 shadow-xl bg-primary">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Config'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ➕ ADD BLOCK DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Deploy Module</DialogTitle>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white custom-scrollbar">
            {['Main', 'Navigation', 'Marketing', 'Services', 'Products', 'UI'].map(category => {
              const types = SECTION_TYPES.filter(t => t.category === category);
              if (types.length === 0) return null;
              return (
                <div key={category} className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2">{category} Blocks</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {types.map((type: any) => (
                      <button key={type.id} onClick={() => handleAddSection(type.id)} className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group">
                        <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors"><type.icon size={28} /></div>
                        <span className="text-[10px] font-black uppercase text-center text-gray-600 group-hover:text-primary leading-tight">{type.label}</span>
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

function CardStyleForm({ type, styles, onChange }: { type: 'productCard' | 'serviceCard', styles: any, onChange: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Aesthetics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Card Background</Label>
              <Input type="color" value={styles.cardBg} onChange={e => onChange(type, 'cardBg', e.target.value)} className="h-10 p-1 bg-white border-gray-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Corner Radius</Label>
              <Input type="number" value={styles.cardRadius} onChange={e => onChange(type, 'cardRadius', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none font-bold" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <Label className="text-[10px] font-black uppercase">Drop Shadow</Label>
            <Switch checked={styles.showShadow} onCheckedChange={v => onChange(type, 'showShadow', v)} />
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Type size={14}/> Typography</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Title Color</Label>
              <Input type="color" value={styles.titleColor} onChange={e => onChange(type, 'titleColor', e.target.value)} className="h-10 p-1 bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Price Color</Label>
              <Input type="color" value={styles.priceColor} onChange={e => onChange(type, 'priceColor', e.target.value)} className="h-10 p-1 bg-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase">Text Align</Label>
            <Select value={styles.textAlign} onValueChange={v => onChange(type, 'textAlign', v)}>
              <SelectTrigger className="h-10 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left Align</SelectItem>
                <SelectItem value="center">Center Align</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2"><MousePointer2 size={14}/> Call-to-Action (Button)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Bg Color</Label>
              <Input type="color" value={styles.btnBg} onChange={e => onChange(type, 'btnBg', e.target.value)} className="h-9 p-1" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase">Text Color</Label>
              <Input type="color" value={styles.btnTextColor} onChange={e => onChange(type, 'btnTextColor', e.target.value)} className="h-9 p-1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase">Button Align</Label>
            <Select value={styles.btnSize} onValueChange={v => onChange(type, 'btnSize', v)}>
              <SelectTrigger className="h-9 bg-white border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="sm">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

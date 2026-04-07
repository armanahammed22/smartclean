
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
  AlignCenter,
  Info,
  Filter,
  Navigation,
  Smartphone,
  Monitor,
  Wrench,
  Sparkles,
  CreditCard,
  ImageIcon,
  Columns,
  PlusCircle,
  Link as LinkIcon,
  AlignLeft,
  AlignRight,
  Edit,
  AlignJustify,
  Database
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

  // Grid Builder Logic
  const [isGridEditOpen, setIsGridEditOpen] = useState(false);
  const [editingGridModule, setEditingGridModule] = useState<any>(null);
  const [isGridSubmitting, setIsGridSubmitting] = useState(false);

  const themeRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'homepage_theme') : null, [db]);
  const { data: globalTheme } = useDoc(themeRef);

  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const sectionsQuery = useMemoFirebase(() => db ? query(sectionsRef!, orderBy('order', 'asc')) : null, [db, sectionsRef]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const gridModulesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'custom_grid_modules'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: gridModules, isLoading: gridsLoading } = useCollection(gridModulesQuery);

  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), orderBy('name', 'asc')) : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);

  const { data: allProducts } = useCollection(productsQuery);
  const { data: allServices } = useCollection(servicesQuery);
  const { data: allSubServices } = useCollection(subServicesQuery);
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
      config: {
        limit: 8,
        titleColor: '#081621',
        titleSizeMobile: 'text-2xl',
        titleSizeDesktop: 'text-5xl',
        titleAlign: 'left',
        gridColsMobile: '2',
        gridColsTablet: '3',
        gridColsDesktop: '5',
        cardTitleColor: '#1f2937',
        cardPriceColor: '#1E5F7A',
        buttonType: 'default',
        buttonBg: '#1E5F7A',
        buttonTextColor: '#ffffff',
        buttonSize: 'sm',
        buttonAlign: 'full',
        buttonText: 'বুক করুন'
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

  // Grid Builder Functions
  const handleCreateGrid = async () => {
    if (!db) return;
    try {
      const defaultCard = {
        id: Math.random().toString(36).substr(2, 9),
        sourceType: 'manual',
        sourceId: '',
        title: 'New Dynamic Card',
        desc: 'Enter a catchy description for this item here.',
        price: '999',
        imageUrl: 'https://picsum.photos/seed/default/400/300',
        btnText: 'View Details',
        btnLink: '#',
        badge: 'NEW',
        isActive: true
      };

      await addDoc(collection(db, 'custom_grid_modules'), {
        name: 'New Grid Template',
        items: [defaultCard],
        styleConfig: {
          columnsMobile: '2',
          columnsTablet: '3',
          columnsDesktop: '4',
          gap: 16,
          cardRadius: 24,
          showShadow: true,
          cardBg: '#ffffff',
          imgHeight: 200,
          textAlign: 'left',
          btnAlign: 'full',
          btnBg: '#1E5F7A',
          btnTextColor: '#ffffff'
        },
        createdAt: new Date().toISOString()
      });
      toast({ title: "Template Initialized", description: "Default card added." });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    }
  };

  const handleUpdateGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingGridModule) return;
    setIsGridSubmitting(true);
    try {
      await updateDoc(doc(db, 'custom_grid_modules', editingGridModule.id), {
        ...editingGridModule,
        updatedAt: serverTimestamp()
      });
      setIsGridEditOpen(false);
      toast({ title: "Grid Template Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsGridSubmitting(false);
    }
  };

  const addGridItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      sourceType: 'manual',
      sourceId: '',
      title: 'New Card',
      desc: 'Short description...',
      price: '',
      imageUrl: '',
      btnText: 'Explore',
      btnLink: '#',
      badge: '',
      isActive: true
    };
    setEditingGridModule({ ...editingGridModule, items: [...(editingGridModule.items || []), newItem] });
  };

  const updateGridItem = (id: string, field: string, val: any) => {
    const nextItems = editingGridModule.items.map((item: any) => {
      if (item.id === id) {
        const updated = { ...item, [field]: val };
        // Auto-fill if dynamic source selected
        if (field === 'sourceId' && updated.sourceType !== 'manual') {
          let sourceData: any = null;
          if (updated.sourceType === 'product') sourceData = allProducts?.find(p => p.id === val);
          if (updated.sourceType === 'service') sourceData = allServices?.find(s => s.id === val);
          if (updated.sourceType === 'sub_service') sourceData = allSubServices?.find(s => s.id === val);
          
          if (sourceData) {
            updated.title = sourceData.name || sourceData.title;
            updated.price = sourceData.price || sourceData.basePrice;
            updated.imageUrl = sourceData.imageUrl;
            updated.btnLink = `/${updated.sourceType}/${sourceData.slug || sourceData.id}`;
          }
        }
        return updated;
      }
      return item;
    });
    setEditingGridModule({ ...editingGridModule, items: nextItems });
  };

  const removeGridItem = (id: string) => {
    setEditingGridModule({ ...editingGridModule, items: editingGridModule.items.filter((item: any) => item.id !== id) });
  };

  const updateGridStyle = (field: string, val: any) => {
    setEditingGridModule({ ...editingGridModule, styleConfig: { ...editingGridModule.styleConfig, [field]: val } });
  };

  if (isLoading && localSections.length === 0) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Homepage Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Centralized portal for layout sequence and dynamic grid templates</p>
        </div>
      </div>

      <Tabs defaultValue="sequence" className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl w-full max-w-md">
          <TabsTrigger value="sequence" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Navigation size={14}/> Layout Sequence
          </TabsTrigger>
          <TabsTrigger value="grids" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
            <Grid size={14}/> Reusable Grids
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
        </TabsContent>

        {/* 🧱 REUSABLE GRIDS TAB */}
        <TabsContent value="grids" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleCreateGrid} className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg">
              <PlusCircle size={18} /> Define New Grid Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridsLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : 
              gridModules?.map((m) => (
                <Card key={m.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100">
                  <CardHeader className="bg-gray-50/50 p-6 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl"><Layers size={18} /></div>
                      <CardTitle className="text-sm font-black uppercase truncate max-w-[150px]">{m.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[8px] font-black">{m.items?.length || 0} CARDS</Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl font-bold h-10 gap-2" onClick={() => { setEditingGridModule(m); setIsGridEditOpen(true); }}>
                        <Edit size={14} /> Design Module
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive rounded-xl hover:bg-red-50" onClick={() => { if(confirm("Delete this grid template?")) deleteDoc(doc(db!, 'custom_grid_modules', m.id)); }}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            }
            {!gridModules?.length && !gridsLoading && (
              <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                <Grid size={48} className="text-gray-200" />
                <p className="font-bold uppercase text-xs">No Grid Templates Defined</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 🛠️ BLOCK STYLE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-t-[2.5rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Settings2 className="text-primary" /> Global Block Logic
              </DialogTitle>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/60"><X size={24}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar max-h-[70vh]">
            <div className="space-y-10">
              {/* 1. TEXT CONTROLS */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Type size={14}/> Heading Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase">Section Heading</Label>
                    <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-11 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-center">Color</Label>
                      <Input type="color" value={editingSection?.config?.titleColor || '#081621'} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, titleColor: e.target.value}})} className="h-11 p-1 w-full" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[9px] font-black uppercase">Alignment</Label>
                      <Select value={editingSection?.config?.titleAlign || 'left'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, titleAlign: v}})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold uppercase text-[9px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left" className="text-[9px] font-black uppercase">Left</SelectItem>
                          <SelectItem value="center" className="text-[9px] font-black uppercase">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. GRID CONTROLS */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Grid & Item Controls</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase">Max Display Items</Label>
                    <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-11 bg-gray-50 border-none rounded-xl" />
                  </div>
                  {editingSection?.type === 'grid_module' ? (
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[9px] font-black uppercase text-blue-600">Link Template Module</Label>
                      <Select value={editingSection?.config?.moduleId || ''} onValueChange={v => setEditingSection({...editingSection, config: { ...editingSection.config, moduleId: v }})}>
                        <SelectTrigger className="h-11 bg-blue-50 border-blue-100 rounded-xl font-bold"><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                        <SelectContent>
                          {gridModules?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[9px] font-black uppercase">Category Filter</Label>
                      <Select value={editingSection?.config?.category || 'All'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, category: v}})}>
                        <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">Show All Categories</SelectItem>
                          {categories?.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. BUTTON OVERRIDE */}
              <div className="space-y-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"><MousePointer2 size={14}/> Action Button Styling</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black">Button Text Override</Label>
                      <Input value={editingSection?.config?.buttonText || 'বুক করুন'} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, buttonText: e.target.value}})} className="h-10 bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black">Type</Label>
                        <Select value={editingSection?.config?.buttonType || 'default'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, buttonType: v}})}>
                          <SelectTrigger className="h-9 text-[9px] uppercase font-bold"><SelectValue/></SelectTrigger>
                          <SelectContent><SelectItem value="default">Solid</SelectItem><SelectItem value="outline">Outline</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black">Size</Label>
                        <Select value={editingSection?.config?.buttonSize || 'sm'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, buttonSize: v}})}>
                          <SelectTrigger className="h-9 text-[9px] uppercase font-bold"><SelectValue/></SelectTrigger>
                          <SelectContent><SelectItem value="sm">Small</SelectItem><SelectItem value="default">Medium</SelectItem><SelectItem value="lg">Large</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black text-center">Background</Label>
                        <Input type="color" value={editingSection?.config?.buttonBg || '#1E5F7A'} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, buttonBg: e.target.value}})} className="h-9 p-1" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black text-center">Text Color</Label>
                        <Input type="color" value={editingSection?.config?.buttonTextColor || '#ffffff'} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, buttonTextColor: e.target.value}})} className="h-9 p-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black">Button Alignment</Label>
                      <Select value={editingSection?.config?.buttonAlign || 'full'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, buttonAlign: v}})}>
                        <SelectTrigger className="h-9 text-[9px] uppercase font-bold"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left" className="text-[9px] uppercase">Left</SelectItem>
                          <SelectItem value="center" className="text-[9px] uppercase">Center</SelectItem>
                          <SelectItem value="full" className="text-[9px] uppercase">Full Width</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex gap-3">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="flex-1 font-bold">Discard</Button>
            <Button onClick={handleUpdateSection} disabled={isSubmitting} className="flex-1 rounded-xl font-black h-12 shadow-xl uppercase text-xs">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Style Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🧱 GRID BUILDER EDIT DIALOG (DYNAMIZED) */}
      <Dialog open={isGridEditOpen} onOpenChange={setIsGridEditOpen}>
        <DialogContent className="max-w-6xl w-[95vw] md:w-[90vw] lg:w-full h-[95vh] md:h-auto md:max-h-[90vh] rounded-none md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="items" className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-4 md:p-8 bg-[#081621] text-white shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-6 border-b border-white/5">
              <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                <div className="p-2 md:p-3 bg-primary rounded-xl md:rounded-2xl shadow-xl hidden xs:block"><Database size={24}/></div>
                <div className="flex-1 min-w-0">
                  <DialogTitle asChild>
                    <Input 
                      value={editingGridModule?.name || ''} 
                      onChange={e => setEditingGridModule({...editingGridModule, name: e.target.value})} 
                      className="h-8 md:h-10 bg-transparent border-none text-base md:text-xl font-black uppercase p-0 focus-visible:ring-0 w-full"
                    />
                  </DialogTitle>
                  <p className="text-white/40 font-bold uppercase text-[8px] md:text-[9px] tracking-widest truncate">Reusable Template Engine</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <TabsList className="bg-white/10 rounded-xl p-1 h-10 flex-1 sm:flex-none">
                  <TabsTrigger value="items" className="text-[9px] md:text-[10px] font-black uppercase rounded-lg px-3 md:px-6 flex-1">Cards</TabsTrigger>
                  <TabsTrigger value="style" className="text-[9px] md:text-[10px] font-black uppercase rounded-lg px-3 md:px-6 flex-1">Style</TabsTrigger>
                </TabsList>
                <button onClick={() => setIsGridEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"><X size={20}/></button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-white custom-scrollbar">
              <TabsContent value="items" className="mt-0 space-y-6 md:space-y-8 pb-4">
                <div className="flex flex-col xs:flex-row justify-between items-center gap-4 px-1">
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                    <Grid size={16} /> Individual Cards ({editingGridModule?.items?.length || 0})
                  </h3>
                  <Button onClick={addGridItem} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] gap-2 shadow-lg w-full xs:w-auto">
                    <PlusCircle size={16} /> Add Dynamic Card
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {editingGridModule?.items?.map((item: any) => (
                    <Card key={item.id} className="border-none shadow-sm bg-gray-50/50 rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 group">
                      <CardContent className="p-0 flex flex-col lg:flex-row">
                        <div className="lg:w-64 p-4 md:p-6 bg-white border-b lg:border-b-0 lg:border-r border-gray-100">
                          <ImageUploader 
                            initialUrl={item.imageUrl} 
                            label="Card Image" 
                            hint={item.sourceType === 'manual' ? "Upload manual image" : "System will fetch automatically"}
                            onUpload={url => updateGridItem(item.id, 'imageUrl', url)} 
                            aspectRatio="aspect-square" 
                          />
                        </div>
                        <div className="flex-1 p-4 md:p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary border-b pb-1">Data Source</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[8px] uppercase font-black">Type</Label>
                                  <Select value={item.sourceType || 'manual'} onValueChange={v => updateGridItem(item.id, 'sourceType', v)}>
                                    <SelectTrigger className="h-9 text-[10px] font-bold bg-white border-none rounded-lg"><SelectValue/></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      <SelectItem value="manual" className="text-[10px] font-bold">Manual Entry</SelectItem>
                                      <SelectItem value="product" className="text-[10px] font-bold">From Product</SelectItem>
                                      <SelectItem value="service" className="text-[10px] font-bold">From Service</SelectItem>
                                      <SelectItem value="sub_service" className="text-[10px] font-bold">From Sub-Service</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {item.sourceType !== 'manual' && (
                                  <div className="space-y-1.5 animate-in slide-in-from-left-2">
                                    <Label className="text-[8px] uppercase font-black">Link Entity</Label>
                                    <Select value={item.sourceId} onValueChange={v => updateGridItem(item.id, 'sourceId', v)}>
                                      <SelectTrigger className="h-9 text-[10px] font-bold bg-white border-none rounded-lg"><SelectValue placeholder="Pick..." /></SelectTrigger>
                                      <SelectContent className="rounded-xl">
                                        {item.sourceType === 'product' && allProducts?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        {item.sourceType === 'service' && allServices?.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                                        {item.sourceType === 'sub_service' && allSubServices?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-[9px] font-black uppercase tracking-widest text-primary border-b pb-1">Overrides</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-[8px] uppercase font-black">Label/Title</Label>
                                  <Input value={item.title} onChange={e => updateGridItem(item.id, 'title', e.target.value)} className="h-9 bg-white border-none rounded-lg font-bold text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[8px] uppercase font-black">Badge</Label>
                                  <Input value={item.badge} onChange={e => updateGridItem(item.id, 'badge', e.target.value)} placeholder="NEW" className="h-9 bg-white border-none rounded-lg font-black text-red-600 text-[9px]" />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase text-gray-400 ml-1">Marketing Summary</Label>
                            <Textarea value={item.desc} onChange={e => updateGridItem(item.id, 'desc', e.target.value)} placeholder="Catchy hook text..." className="min-h-[80px] bg-white border-none rounded-xl text-xs p-4 leading-relaxed" />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400 ml-1">Price Override (৳)</Label>
                              <Input value={item.price} onChange={e => updateGridItem(item.id, 'price', e.target.value)} className="h-9 bg-white border-none rounded-lg font-black text-primary" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400 ml-1">Button Text</Label>
                              <Input value={item.btnText} onChange={e => updateGridItem(item.id, 'btnText', e.target.value)} className="h-9 bg-white border-none rounded-lg font-black text-[10px] uppercase" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-gray-400 ml-1">Target Link</Label>
                              <Input value={item.btnLink} onChange={e => updateGridItem(item.id, 'btnLink', e.target.value)} className="h-9 bg-white border-none rounded-lg font-mono text-[10px]" />
                            </div>
                          </div>
                        </div>
                        <div className="lg:w-16 flex flex-row lg:flex-col items-center justify-center p-2 lg:p-4 gap-4 bg-gray-100/50">
                          <button onClick={() => removeGridItem(item.id)} className="p-2 text-destructive hover:bg-red-100 rounded-xl transition-all"><Trash2 size={18}/></button>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[7px] font-black uppercase text-gray-400">Live</span>
                            <Switch checked={item.isActive} onCheckedChange={v => updateGridItem(item.id, 'isActive', v)} className="scale-75" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="style" className="mt-0 space-y-8 md:space-y-12 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Layout Geometry</h4>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Mob. Cols</Label>
                        <Input type="number" value={editingGridModule?.styleConfig?.columnsMobile || 2} onChange={e => updateGridStyle('columnsMobile', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-center" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Tab. Cols</Label>
                        <Input type="number" value={editingGridModule?.styleConfig?.columnsTablet || 3} onChange={e => updateGridStyle('columnsTablet', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-center" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Desk. Cols</Label>
                        <Input type="number" value={editingGridModule?.styleConfig?.columnsDesktop || 4} onChange={e => updateGridStyle('columnsDesktop', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-bold text-center" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Grid Spacing (Gap px)</Label>
                      <Input type="number" value={editingGridModule?.styleConfig?.gap || 16} onChange={e => updateGridStyle('gap', parseInt(e.target.value))} className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary px-6" />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 border-b pb-2 flex items-center gap-2"><Palette size={14}/> Aesthetic Styles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Image Height</Label>
                        <Input type="number" value={editingGridModule?.styleConfig?.imgHeight || 200} onChange={e => updateGridStyle('imgHeight', parseInt(e.target.value))} className="h-11 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Corner Radius</Label>
                        <Input type="number" value={editingGridModule?.styleConfig?.cardRadius || 24} onChange={e => updateGridStyle('cardRadius', parseInt(e.target.value))} className="h-11 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Card Background</Label>
                        <div className="flex gap-2">
                          <div className="w-11 h-11 rounded-xl border p-1 bg-white">
                            <Input type="color" value={editingGridModule?.styleConfig?.cardBg || '#ffffff'} onChange={e => updateGridStyle('cardBg', e.target.value)} className="w-full h-full p-0 border-none rounded-lg" />
                          </div>
                          <Input value={editingGridModule?.styleConfig?.cardBg || '#ffffff'} onChange={e => updateGridStyle('cardBg', e.target.value)} className="h-11 bg-gray-50 border-none rounded-xl font-mono text-xs" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400">Txt Alignment</Label>
                        <Select value={editingGridModule?.styleConfig?.textAlign} onValueChange={v => updateGridStyle('textAlign', v)}>
                          <SelectTrigger className="h-11 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <DialogFooter className="p-4 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col xs:flex-row gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsGridEditOpen(false)} className="flex-1 md:flex-none h-12 md:h-14 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest order-2 xs:order-1">Discard</Button>
              <Button onClick={handleUpdateGrid} disabled={isGridSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black px-12 shadow-xl uppercase text-xs tracking-widest order-1 xs:order-2">
                {isGridSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Template</>}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ➕ ADD SECTION DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-t-[2rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <DialogHeader className="p-6 md:p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Deploy Interface Module</DialogTitle>
            <DialogDescription className="text-white/40 font-bold uppercase text-[9px] tracking-widest mt-1">Select a component logic to insert into the homepage sequence</DialogDescription>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white custom-scrollbar">
            {['Main', 'Custom', 'Marketing', 'Services', 'Business', 'Products', 'UI', 'Navigation'].map(category => {
              const categoryTypes = SECTION_TYPES.filter(t => t.category === category);
              if (categoryTypes.length === 0) return null;
              return (
                <div key={category} className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {category} Logic
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


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
  Columns,
  ShoppingCart,
  Link as LinkIcon,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TicketPercent,
  Gift,
  RefreshCw,
  Box,
  Palette as PaletteIcon,
  AlignLeft,
  AlignCenter,
  MoveVertical
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
import Image from 'next/image';

const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout, category: 'Main' },
  { id: 'side_promo', label: 'Side Promo (2 Slots)', icon: Columns, category: 'Main' },
  { id: 'top_nav_links', label: 'Top Nav Links', icon: Navigation, category: 'Navigation' },
  { id: 'icon_grid', label: 'Icon Grid', icon: Grid, category: 'Navigation' },
  { id: 'categories', label: 'Categories Grid', icon: Layers, category: 'Navigation' },
  { id: 'flash_deals', label: 'Flash Sale Slider', icon: Zap, category: 'Marketing' },
  { id: 'campaign', label: 'Mega Campaign Banner', icon: Zap, category: 'Marketing' },
  { id: 'advanced_offers', label: 'Advanced Offers Row', icon: Gift, category: 'Marketing' },
  { id: 'coupons_grid', label: 'Coupons Grid', icon: TicketPercent, category: 'Marketing' },
  { id: 'section_banners', label: 'Section Banners', icon: ImageIcon, category: 'Marketing' },
  { id: 'products_dynamic', label: 'Dynamic Products', icon: Package, category: 'Products' },
  { id: 'services_dynamic', label: 'Dynamic Services', icon: Wrench, category: 'Services' },
  { id: 'trust_stats', label: 'Trust Stats Counter', icon: Users, category: 'UI' }
];

const FONT_SIZES = [
  { label: 'Extra Small', value: 'text-[10px]' },
  { label: 'Small', value: 'text-xs' },
  { label: 'Base', value: 'text-sm' },
  { label: 'Medium', value: 'text-base' },
  { label: 'Large', value: 'text-lg' },
  { label: 'Extra Large', value: 'text-xl' },
  { label: '2XL', value: 'text-2xl' }
];

export default function HomepageBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localSections, setLocalSections] = useState<any[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // 1. Fetch Global Styling Data
  const stylesRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'card_styles') : null, [db]);
  const { data: globalStyles, isLoading: stylesLoading } = useDoc(stylesRef);

  // 2. Local State for Styles
  const [localStyles, setLocalStyles] = useState<any>(null);

  useEffect(() => {
    if (globalStyles) setLocalStyles(globalStyles);
    else setLocalStyles({
      productCard: { 
        cardBg: '#ffffff', 
        cardRadius: 16, 
        cardPadding: 16,
        elementGap: 12,
        textAlign: 'left',
        titleSize: 'text-sm',
        titleColor: '#1f2937',
        priceSize: 'text-lg',
        priceColor: '#1E5F7A',
        metaSize: 'text-[10px]',
        metaColor: '#9ca3af',
        primaryBtnBg: '#1E5F7A', 
        primaryBtnColor: '#ffffff', 
        primaryBtnSize: 'text-[10px]',
        primaryBtnEnabled: true, 
        secondaryBtnEnabled: false 
      },
      serviceCard: { 
        cardBg: '#ffffff', 
        cardRadius: 16, 
        cardPadding: 16,
        elementGap: 12,
        textAlign: 'left',
        titleSize: 'text-sm',
        titleColor: '#1f2937',
        priceSize: 'text-lg',
        priceColor: '#1E5F7A',
        metaSize: 'text-[10px]',
        metaColor: '#9ca3af',
        primaryBtnBg: '#1E5F7A', 
        primaryBtnColor: '#ffffff', 
        primaryBtnSize: 'text-[10px]',
        primaryBtnEnabled: true, 
        secondaryBtnEnabled: false 
      }
    });
  }, [globalStyles]);

  // 3. Fetch Layout Sections
  const sectionsRef = useMemoFirebase(() => db ? collection(db, 'homepage_sections') : null, [db]);
  const sectionsQuery = useMemoFirebase(() => db ? query(sectionsRef!, orderBy('order', 'asc')) : null, [db, sectionsRef]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const brandsQuery = useMemoFirebase(() => db ? collection(db, 'brands') : null, [db]);
  const { data: brands } = useCollection(brandsQuery);

  const vendorsQuery = useMemoFirebase(() => db ? collection(db, 'vendor_profiles') : null, [db]);
  const { data: vendors } = useCollection(vendorsQuery);

  const campaignsQuery = useMemoFirebase(() => db ? collection(db, 'campaigns') : null, [db]);
  const { data: campaigns } = useCollection(campaignsQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts } = useCollection(productsQuery);

  const servicesQuery = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);
  const { data: allServices } = useCollection(servicesQuery);

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

  const handleSaveStyles = async () => {
    if (!db || !localStyles) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'card_styles'), localStyles);
      toast({ title: "Global Styles Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Styles Update Failed" });
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
        sourceType: 'all',
        sourceId: '',
        sortBy: 'latest',
        gridColsMobile: '2',
        gridColsDesktop: '5',
        titleAlign: 'left',
        manualIds: []
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

  const updateCardStyle = (cardType: 'productCard' | 'serviceCard', field: string, val: any) => {
    setLocalStyles({
      ...localStyles,
      [cardType]: { ...localStyles[cardType], [field]: val }
    });
  };

  const filteredItemsForManual = useMemo(() => {
    if (!itemSearchQuery.trim()) return [];
    const source = editingSection?.type === 'services_dynamic' ? allServices : allProducts;
    return source?.filter((i: any) => 
      (i.name || i.title || '').toLowerCase().includes(itemSearchQuery.toLowerCase())
    ).slice(0, 10);
  }, [itemSearchQuery, allProducts, allServices, editingSection?.type]);

  const toggleManualId = (id: string) => {
    const currentIds = editingSection.config.manualIds || [];
    const nextIds = currentIds.includes(id) 
      ? currentIds.filter((i: string) => i !== id) 
      : [...currentIds, id].slice(0, 20);
    setEditingSection({
      ...editingSection,
      config: { ...editingSection.config, manualIds: nextIds }
    });
  };

  if (isLoading || stylesLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Homepage Engine</h1>
          <p className="text-muted-foreground text-sm font-medium mt-2">Manage dynamic layout sequence and source-based data pipes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary">
            <Plus size={18} /> Add Module
          </Button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="gap-2 font-black h-11 px-6 rounded-xl bg-white shadow-sm">
            <Save size={18} /> Sync Sequence
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sequence" className="space-y-8">
        <TabsList className="bg-white border p-1 h-12 rounded-xl flex overflow-x-auto no-scrollbar whitespace-nowrap shadow-sm">
          <TabsTrigger value="sequence" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Layout size={14}/> Layout Sequence</TabsTrigger>
          <TabsTrigger value="styles" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><PaletteIcon size={14}/> Global Card Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="sequence" className="max-w-4xl mx-auto space-y-3 mt-0">
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
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 h-4 border-gray-200">
                        {typeInfo?.label || section.type}
                      </Badge>
                      {section.config?.sourceType && (
                        <span className="text-[8px] font-black text-primary/60 uppercase">Source: {section.config.sourceType}</span>
                      )}
                    </div>
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
        </TabsContent>

        <TabsContent value="styles" className="space-y-8 mt-0">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
            <div>
              <h2 className="text-xl font-black uppercase text-[#081621]">Global Aesthetics</h2>
              <p className="text-xs text-muted-foreground font-medium">Styles defined here apply to every card in the product/service grid.</p>
            </div>
            <Button onClick={handleSaveStyles} disabled={isSubmitting} className="rounded-xl h-12 px-10 font-black uppercase shadow-xl shadow-primary/20">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} Publish Visual Rules
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Card Style */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-red-50/50 border-b p-8">
                <CardTitle className="text-xl font-black uppercase text-red-900 flex items-center gap-3"><Package size={24}/> Product Card Rules</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Card Background</Label>
                    <Input type="color" value={localStyles?.productCard?.cardBg} onChange={e => updateCardStyle('productCard', 'cardBg', e.target.value)} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Radius (px)</Label>
                    <Input type="number" value={localStyles?.productCard?.cardRadius} onChange={e => updateCardStyle('productCard', 'cardRadius', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Padding (px)</Label>
                    <Input type="number" value={localStyles?.productCard?.cardPadding} onChange={e => updateCardStyle('productCard', 'cardPadding', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Element Gap (px)</Label>
                    <Input type="number" value={localStyles?.productCard?.elementGap} onChange={e => updateCardStyle('productCard', 'elementGap', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Type size={14}/> Typography & Spacing</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Title Size</Label>
                        <Select value={localStyles?.productCard?.titleSize} onValueChange={v => updateCardStyle('productCard', 'titleSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Title Color</Label>
                        <Input type="color" value={localStyles?.productCard?.titleColor} onChange={e => updateCardStyle('productCard', 'titleColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Price Size</Label>
                        <Select value={localStyles?.productCard?.priceSize} onValueChange={v => updateCardStyle('productCard', 'priceSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Price Color</Label>
                        <Input type="color" value={localStyles?.productCard?.priceColor} onChange={e => updateCardStyle('productCard', 'priceColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Meta Text Size</Label>
                        <Select value={localStyles?.productCard?.metaSize} onValueChange={v => updateCardStyle('productCard', 'metaSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Meta Color</Label>
                        <Input type="color" value={localStyles?.productCard?.metaColor} onChange={e => updateCardStyle('productCard', 'metaColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><MousePointer2 size={14}/> Interaction Logic</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Btn Background</Label>
                      <Input type="color" value={localStyles?.productCard?.primaryBtnBg} onChange={e => updateCardStyle('productCard', 'primaryBtnBg', e.target.value)} className="h-9 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Btn Text Color</Label>
                      <Input type="color" value={localStyles?.productCard?.primaryBtnColor} onChange={e => updateCardStyle('productCard', 'primaryBtnColor', e.target.value)} className="h-9 p-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase">Enable Add to Cart</Label>
                      <p className="text-[8px] font-bold text-gray-400">SHOW SECONDARY BUTTON</p>
                    </div>
                    <Switch checked={localStyles?.productCard?.secondaryBtnEnabled} onCheckedChange={v => updateCardStyle('productCard', 'secondaryBtnEnabled', v)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Card Style */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-100">
              <CardHeader className="bg-indigo-50/50 border-b p-8">
                <CardTitle className="text-xl font-black uppercase text-indigo-900 flex items-center gap-3"><Wrench size={24}/> Service Card Rules</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Card Background</Label>
                    <Input type="color" value={localStyles?.serviceCard?.cardBg} onChange={e => updateCardStyle('serviceCard', 'cardBg', e.target.value)} className="h-10 p-1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Radius (px)</Label>
                    <Input type="number" value={localStyles?.serviceCard?.cardRadius} onChange={e => updateCardStyle('serviceCard', 'cardRadius', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Padding (px)</Label>
                    <Input type="number" value={localStyles?.serviceCard?.cardPadding} onChange={e => updateCardStyle('serviceCard', 'cardPadding', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-gray-400">Element Gap (px)</Label>
                    <Input type="number" value={localStyles?.serviceCard?.elementGap} onChange={e => updateCardStyle('serviceCard', 'elementGap', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Type size={14}/> Typography & Spacing</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Title Size</Label>
                        <Select value={localStyles?.serviceCard?.titleSize} onValueChange={v => updateCardStyle('serviceCard', 'titleSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Title Color</Label>
                        <Input type="color" value={localStyles?.serviceCard?.titleColor} onChange={e => updateCardStyle('serviceCard', 'titleColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Price Size</Label>
                        <Select value={localStyles?.serviceCard?.priceSize} onValueChange={v => updateCardStyle('serviceCard', 'priceSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Price Color</Label>
                        <Input type="color" value={localStyles?.serviceCard?.priceColor} onChange={e => updateCardStyle('serviceCard', 'priceColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Meta Text Size</Label>
                        <Select value={localStyles?.serviceCard?.metaSize} onValueChange={v => updateCardStyle('serviceCard', 'metaSize', v)}>
                          <SelectTrigger className="h-9 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_SIZES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Meta Color</Label>
                        <Input type="color" value={localStyles?.serviceCard?.metaColor} onChange={e => updateCardStyle('serviceCard', 'metaColor', e.target.value)} className="h-9 p-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><MousePointer2 size={14}/> Interaction Logic</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase">Show "View Details" Btn</Label>
                      <p className="text-[8px] font-bold text-gray-400">SECONDARY CTA</p>
                    </div>
                    <Switch checked={localStyles?.serviceCard?.secondaryBtnEnabled} onCheckedChange={v => updateCardStyle('serviceCard', 'secondaryBtnEnabled', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase">Text Alignment</Label>
                    <Select value={localStyles?.serviceCard?.textAlign} onValueChange={v => updateCardStyle('serviceCard', 'textAlign', v)}>
                      <SelectTrigger className="h-10 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left Aligned</SelectItem>
                        <SelectItem value="center">Centered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🛠️ SECTION EDITOR DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col bg-white">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-xl"><Settings2 size={24}/></div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Configure Module</DialogTitle>
                  <DialogDescription className="text-white/40 font-bold uppercase text-[9px]">Type: {editingSection?.type}</DialogDescription>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"><X size={24}/></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column: Metadata */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Heading & Logic</h4>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Section Title</Label>
                    <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Limit Items</Label>
                      <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sorting</Label>
                      <Select value={editingSection?.config?.sortBy || 'latest'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, sortBy: v}})}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="latest">Newest First</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                          <SelectItem value="rating">Top Rated</SelectItem>
                          <SelectItem value="discount">Highest Discount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Data Source Configuration */}
                {(editingSection?.type === 'products_dynamic' || editingSection?.type === 'services_dynamic') && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b pb-2">Intelligence Source</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Source Type</Label>
                        <Select 
                          value={editingSection?.config?.sourceType || 'all'} 
                          onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, sourceType: v, sourceId: '', manualIds: []}})}
                        >
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Global Catalog (All)</SelectItem>
                            <SelectItem value="category">Specific Category</SelectItem>
                            {editingSection.type === 'products_dynamic' && <SelectItem value="brand">Brand Specific</SelectItem>}
                            {editingSection.type === 'products_dynamic' && <SelectItem value="vendor">Vendor Shop</SelectItem>}
                            {editingSection.type === 'products_dynamic' && <SelectItem value="campaign">Marketing Campaign</SelectItem>}
                            <SelectItem value="manual">Manual Selection (Pinned)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {['category', 'brand', 'vendor', 'campaign'].includes(editingSection.config.sourceType) && (
                        <div className="space-y-2 animate-in zoom-in-95">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Assign {editingSection.config.sourceType}</Label>
                          <Select 
                            value={editingSection?.config?.sourceId || ''} 
                            onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, sourceId: v}})}
                          >
                            <SelectTrigger className="h-12 bg-indigo-50 border-none rounded-xl font-black text-indigo-700">
                              <SelectValue placeholder="Select Source..." />
                            </SelectTrigger>
                            <SelectContent>
                              {editingSection.config.sourceType === 'category' && categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) || (
                                 <SelectItem value="none" disabled>No categories available</SelectItem>
                              )}
                              {editingSection.config.sourceType === 'brand' && brands?.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>) || (
                                 <SelectItem value="none" disabled>No brands available</SelectItem>
                              )}
                              {editingSection.config.sourceType === 'vendor' && vendors?.map(v => <SelectItem key={v.id} value={v.id}>{v.shopName}</SelectItem>) || (
                                 <SelectItem value="none" disabled>No vendors available</SelectItem>
                              )}
                              {editingSection.config.sourceType === 'campaign' && campaigns?.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>) || (
                                 <SelectItem value="none" disabled>No campaigns available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Manual Item Picker or Style */}
              <div className="space-y-8">
                {editingSection?.config?.sourceType === 'manual' ? (
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col h-[400px] animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Item Selector</h4>
                      <Badge className="bg-primary text-white border-none">{editingSection.config.manualIds?.length || 0}/20</Badge>
                    </div>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <Input 
                        placeholder="Search items..." 
                        value={itemSearchQuery}
                        onChange={e => setItemSearchQuery(e.target.value)}
                        className="h-10 pl-9 bg-white border-none rounded-xl text-xs"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {filteredItemsForManual?.map((item: any) => {
                        const isSelected = editingSection.config.manualIds?.includes(item.id);
                        return (
                          <div 
                            key={item.id} 
                            onClick={() => toggleManualId(item.id)}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                              isSelected ? "border-primary bg-primary/5" : "border-transparent bg-white hover:border-primary/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden border bg-gray-50">
                                {item.imageUrl && <Image src={item.imageUrl} alt="P" fill className="object-cover" unoptimized />}
                              </div>
                              <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">{item.name || item.title}</span>
                            </div>
                            {isSelected ? <CheckCircle2 size={16} className="text-primary" /> : <PlusCircle size={16} className="text-gray-200" />}
                          </div>
                        );
                      })}
                      {itemSearchQuery && filteredItemsForManual.length === 0 && <p className="text-center py-10 text-[10px] font-black uppercase opacity-20">No matching items</p>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Layout Aesthetics</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Grid Cols (Desktop)</Label>
                        <Select value={editingSection?.config?.gridColsDesktop || '5'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, gridColsDesktop: v}})}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['2', '3', '4', '5', '6'].map(c => <SelectItem key={c} value={c}>{c} Columns</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Grid Cols (Mobile)</Label>
                        <Select value={editingSection?.config?.gridColsMobile || '2'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, gridColsMobile: v}})}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['1', '2'].map(c => <SelectItem key={c} value={c}>{c} Column</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="flex-1 sm:flex-none h-12 md:h-14 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
            <Button onClick={handleUpdateSection} disabled={isSubmitting} className="flex-1 h-12 md:h-14 rounded-xl font-black bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95 text-xs">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Publish Component</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ➕ ADD SECTION DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col bg-white">
          <DialogHeader className="p-10 bg-[#081621] text-white shrink-0 relative">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Deploy Module</DialogTitle>
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full text-white/60"><X size={24}/></button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
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

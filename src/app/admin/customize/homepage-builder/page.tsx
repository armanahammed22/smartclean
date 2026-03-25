
'use client';

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
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
  Copy, 
  Eye, 
  Save, 
  Loader2, 
  Layout, 
  Settings2,
  Package,
  Layers,
  Zap,
  Tag,
  Store,
  ChevronDown
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SECTION_TYPES = [
  { id: 'hero', label: 'Main Hero Slider', icon: Layout },
  { id: 'flash_deals', label: 'Flash Sale Slider', icon: Zap },
  { id: 'categories', label: 'Categories Grid', icon: Layers },
  { id: 'campaign', label: 'Mega Campaign Banner', icon: Zap },
  { id: 'services', label: 'Services Grid', icon: Package },
  { id: 'products_feed', label: 'Dynamic Products Feed', icon: Tag },
  { id: 'custom_grid', label: 'Custom Products Grid', icon: Tag }
];

export default function HomepageBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const sectionsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const categoriesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  // Native DnD Logic
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newSections = [...(sections || [])];
    const item = newSections.splice(draggedItem, 1)[0];
    newSections.splice(index, 0, item);
    
    setDraggedItem(index);
  };

  const saveOrder = async () => {
    if (!db || !sections) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      sections.forEach((s, idx) => {
        batch.update(doc(db, 'homepage_sections', s.id), { order: idx });
      });
      await batch.commit();
      toast({ title: "Layout Order Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving Order" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'homepage_sections', id), { isActive: !current });
  };

  const handleDuplicate = async (section: any) => {
    if (!db) return;
    const { id, ...data } = section;
    await addDoc(collection(db, 'homepage_sections'), {
      ...data,
      title: `${data.title} (Copy)`,
      order: (sections?.length || 0),
      createdAt: new Date().toISOString()
    });
    toast({ title: "Section Duplicated" });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this section from home?")) return;
    await deleteDoc(doc(db, 'homepage_sections', id));
    toast({ title: "Section Removed" });
  };

  const handleAddSection = async (type: string) => {
    if (!db) return;
    const typeInfo = SECTION_TYPES.find(t => t.id === type);
    await addDoc(collection(db, 'homepage_sections'), {
      type,
      title: typeInfo?.label || 'New Section',
      isActive: true,
      order: (sections?.length || 0),
      config: {
        layout: 'grid',
        itemsPerRow: 4,
        dataSource: 'all',
        limit: 8
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
      toast({ title: "Section Settings Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Visual Homepage Builder</h1>
          <p className="text-muted-foreground text-sm font-medium">Drag, toggle, and customize your landing page layout</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2 bg-primary text-white font-black h-11 px-6 rounded-xl shadow-lg hover:bg-primary/90 transition-all">
            <Plus size={18} /> Add New Section
          </button>
          <Button onClick={saveOrder} disabled={isSubmitting} variant="outline" className="gap-2 font-black h-11 px-6 rounded-xl border-primary/20 text-primary">
            <Save size={18} /> Save Layout Order
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {sections?.map((section, index) => {
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
                <div className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <GripVertical size={20} className="text-gray-400" />
                </div>
                
                <div className={cn("p-2.5 rounded-xl", section.isActive ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400")}>
                  <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 uppercase text-xs tracking-tight">{section.title}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{section.type.replace('_', ' ')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[9px] font-black uppercase text-muted-foreground">{section.isActive ? 'Active' : 'Hidden'}</span>
                    <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} />
                  </div>
                  
                  <div className="h-8 w-px bg-gray-100 mx-1" />

                  <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:bg-blue-50" onClick={() => { setEditingSection(section); setIsEditOpen(true); }}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-amber-600 hover:bg-amber-50" onClick={() => handleDuplicate(section)}>
                    <Copy size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-red-50" onClick={() => handleDelete(section.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!sections?.length && (
          <div className="p-24 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Layout size={48} className="opacity-20" />
            <p>No sections found. Start building your homepage.</p>
            <Button onClick={() => setIsAddOpen(true)} variant="outline" className="rounded-full font-bold">Initialize Builder</Button>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <form onSubmit={handleUpdateSection} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Section Config</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Section Heading</Label>
                <Input value={editingSection?.title || ''} onChange={e => setEditingSection({...editingSection, title: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Layout Type</Label>
                  <Select value={editingSection?.config?.layout || 'grid'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, layout: v}})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Layout</SelectItem>
                      <SelectItem value="slider">Carousel Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Items Per Row</Label>
                  <Input type="number" value={editingSection?.config?.itemsPerRow || 4} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, itemsPerRow: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Source</Label>
                <Select value={editingSection?.config?.dataSource || 'all'} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, dataSource: v}})}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active Products</SelectItem>
                    <SelectItem value="popular">Most Popular Only</SelectItem>
                    <SelectItem value="category">Specific Category</SelectItem>
                    <SelectItem value="latest">Newly Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingSection?.config?.dataSource === 'category' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Category</Label>
                  <Select value={editingSection?.config?.categoryId || ''} onValueChange={v => setEditingSection({...editingSection, config: {...editingSection.config, categoryId: v}})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Items Limit</Label>
                <Input type="number" value={editingSection?.config?.limit || 8} onChange={e => setEditingSection({...editingSection, config: {...editingSection.config, limit: parseInt(e.target.value)}})} className="h-12 bg-gray-50 border-none rounded-xl" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Apply Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add Layout Block</DialogTitle>
            <DialogDescription className="text-white/40">Select a section type to add to your homepage</DialogDescription>
          </DialogHeader>
          <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-4 bg-white">
            {SECTION_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleAddSection(type.id)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-50 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <type.icon size={24} />
                </div>
                <span className="text-[10px] font-black uppercase text-center text-gray-600 group-hover:text-primary tracking-tight">{type.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

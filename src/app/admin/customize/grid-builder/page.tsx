
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Grid, 
  Settings2, 
  Palette, 
  Type, 
  Maximize, 
  MousePointer2, 
  X, 
  PlusCircle, 
  ImageIcon, 
  Sparkles,
  Layers,
  Edit
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Textarea } from '@/components/ui/textarea';

export default function GridBuilderPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);

  const modulesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'custom_grid_modules'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: modules, isLoading } = useCollection(modulesQuery);

  const handleCreateModule = async () => {
    if (!db) return;
    try {
      const docRef = await addDoc(collection(db, 'custom_grid_modules'), {
        name: 'New Grid Module',
        items: [],
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
      toast({ title: "Module Created", description: "Click edit to design your grid." });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingModule) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'custom_grid_modules', editingModule.id), {
        ...editingModule,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
      toast({ title: "Grid Module Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Card',
      desc: 'Description text...',
      price: '',
      imageUrl: '',
      btnText: 'Action',
      btnLink: '#',
      badge: '',
      isActive: true
    };
    setEditingModule({ ...editingModule, items: [...(editingModule.items || []), newItem] });
  };

  const updateItem = (id: string, field: string, val: any) => {
    const nextItems = editingModule.items.map((item: any) => item.id === id ? { ...item, [field]: val } : item);
    setEditingModule({ ...editingModule, items: nextItems });
  };

  const removeItem = (id: string) => {
    setEditingModule({ ...editingModule, items: editingModule.items.filter((item: any) => item.id !== id) });
  };

  const updateStyle = (field: string, val: any) => {
    setEditingModule({ ...editingModule, styleConfig: { ...editingModule.styleConfig, [field]: val } });
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Reusable Grid Builder</h1>
          <p className="text-muted-foreground text-sm font-medium">Create and design custom card blocks for use across your site</p>
        </div>
        <Button onClick={handleCreateModule} className="gap-2 font-black h-11 px-8 rounded-xl shadow-lg bg-primary">
          <Plus size={18} /> Create New Grid
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div> : 
          modules?.map((m) => (
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
                  <Button variant="outline" className="flex-1 rounded-xl font-bold h-10 gap-2" onClick={() => { setEditingModule(m); setIsEditOpen(true); }}>
                    <Edit size={14} /> Design Grid
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive rounded-xl hover:bg-red-50" onClick={() => { if(confirm("Delete this module?")) deleteDoc(doc(db!, 'custom_grid_modules', m.id)); }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
        {!modules?.length && !isLoading && (
          <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Grid size={48} className="text-gray-200" />
            <p className="font-bold uppercase text-xs">No Grid Modules Built Yet</p>
          </div>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] rounded-t-[2.5rem] md:rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col">
          <Tabs defaultValue="items" className="flex flex-col h-full">
            <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl shadow-xl"><Settings2 size={24}/></div>
                <div>
                  <Input 
                    value={editingModule?.name || ''} 
                    onChange={e => setEditingModule({...editingModule, name: e.target.value})} 
                    className="h-8 bg-transparent border-none text-xl font-black uppercase p-0 focus-visible:ring-0 w-full md:w-[300px]"
                  />
                  <p className="text-white/40 font-bold uppercase text-[9px] tracking-widest">Editing Grid Module</p>
                </div>
              </div>
              <TabsList className="bg-white/10 rounded-xl p-1 h-10">
                <TabsTrigger value="items" className="text-[10px] font-black uppercase rounded-lg px-6">Manage Cards</TabsTrigger>
                <TabsTrigger value="style" className="text-[10px] font-black uppercase rounded-lg px-6">Grid Design</TabsTrigger>
              </TabsList>
              <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white custom-scrollbar">
              <TabsContent value="items" className="mt-0 space-y-8">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#081621]">Cards ({editingModule?.items?.length || 0})</h3>
                  <Button onClick={addItem} className="rounded-xl h-10 px-6 font-black uppercase text-[10px] gap-2 shadow-lg">
                    <PlusCircle size={16} /> Add New Card
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {editingModule?.items?.map((item: any) => (
                    <Card key={item.id} className="border-none shadow-sm bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100 group">
                      <CardContent className="p-0 flex flex-col lg:flex-row">
                        <div className="lg:w-64 p-6 bg-white border-r border-gray-100">
                          <ImageUploader initialUrl={item.imageUrl} label="Card Image" onUpload={url => updateItem(item.id, 'imageUrl', url)} aspectRatio="aspect-square" />
                        </div>
                        <div className="flex-1 p-6 md:p-8 space-y-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase">Card Title</Label>
                                  <Input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} className="h-10 bg-white border-none rounded-xl font-bold" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[9px] font-black uppercase">Badge Text</Label>
                                  <Input value={item.badge} onChange={e => updateItem(item.id, 'badge', e.target.value)} placeholder="e.g. -20%" className="h-10 bg-white border-none rounded-xl font-black text-red-600 uppercase text-[9px]" />
                                </div>
                              </div>
                              <Textarea value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder="Description..." className="min-h-[80px] bg-white border-none rounded-xl text-xs" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => removeItem(item.id)} className="p-2 text-destructive hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                              <Switch checked={item.isActive} onCheckedChange={v => updateItem(item.id, 'isActive', v)} className="scale-75" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase">Price Tag (৳)</Label>
                              <Input value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} placeholder="0.00" className="h-10 bg-white border-none rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase">Button Text</Label>
                              <Input value={item.btnText} onChange={e => updateItem(item.id, 'btnText', e.target.value)} className="h-10 bg-white border-none rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase">Action URL</Label>
                              <Input value={item.btnLink} onChange={e => updateItem(item.id, 'btnLink', e.target.value)} className="h-10 bg-white border-none rounded-xl font-mono text-[10px]" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="style" className="mt-0 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Maximize size={14}/> Layout Geometry</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Mobile Cols</Label>
                        <Input type="number" value={editingModule?.styleConfig?.columnsMobile || 2} onChange={e => updateStyle('columnsMobile', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Tablet Cols</Label>
                        <Input type="number" value={editingModule?.styleConfig?.columnsTablet || 3} onChange={e => updateStyle('columnsTablet', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Desktop Cols</Label>
                        <Input type="number" value={editingModule?.styleConfig?.columnsDesktop || 4} onChange={e => updateStyle('columnsDesktop', e.target.value)} className="h-10 bg-gray-50 border-none rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Gap Between Cards (px)</Label>
                      <Input type="number" value={editingModule?.styleConfig?.gap || 16} onChange={e => updateStyle('gap', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b pb-2 flex items-center gap-2"><Palette size={14}/> Aesthetic Styles</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Image Height (px)</Label>
                        <Input type="number" value={editingModule?.styleConfig?.imgHeight || 200} onChange={e => updateStyle('imgHeight', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Corner Radius (px)</Label>
                        <Input type="number" value={editingModule?.styleConfig?.cardRadius || 24} onChange={e => updateStyle('cardRadius', parseInt(e.target.value))} className="h-10 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Card Background</Label>
                        <Input type="color" value={editingModule?.styleConfig?.cardBg || '#ffffff'} onChange={e => updateStyle('cardBg', e.target.value)} className="h-10 p-1" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Text Alignment</Label>
                        <Select value={editingModule?.styleConfig?.textAlign} onValueChange={v => updateStyle('textAlign', v)}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
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

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Discard</Button>
              <Button onClick={handleUpdateModule} disabled={isSubmitting} className="rounded-xl font-black px-12 h-14 shadow-xl uppercase text-xs tracking-widest">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Module</>}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

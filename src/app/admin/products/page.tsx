
"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Tag, 
  ShoppingCart, 
  Loader2, 
  Save, 
  Layers, 
  Wrench, 
  Users, 
  Settings2, 
  X, 
  ImageIcon, 
  Sparkles, 
  ListChecks, 
  Shapes,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  Eye,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductsManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Multi-Step Form State
  const [activeTab, setActiveTab] = useState('identity');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [variants, setVariants] = useState<{ name: string; options: string[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Data Queries
  const productsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'categories')) : null, [db, user]);
  const brandsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'brands'), orderBy('name', 'asc')) : null, [db, user]);

  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: brands } = useCollection(brandsQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      regularPrice: parseFloat(formData.get('regularPrice') as string) || 0,
      stockQuantity: parseInt(formData.get('stockQuantity') as string),
      categoryId: selectedCategory,
      brand: formData.get('brand') as string || 'General',
      description: formData.get('description') as string,
      imageUrl: uploadedImageUrl || editingProduct?.imageUrl || '',
      galleryImages: galleryImages,
      specifications: specifications,
      variants: variants,
      status: formData.get('status') as string || 'Active',
      isPopular: formData.get('isPopular') === 'on',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast({ title: "Inventory Updated" });
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
        toast({ title: "Product Catalogued" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setUploadedImageUrl('');
    setGalleryImages([]);
    setSpecifications([]);
    setVariants([]);
    setSelectedCategory('');
    setActiveTab('identity');
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || '');
    setGalleryImages(product.galleryImages || []);
    setSpecifications(product.specifications || []);
    setVariants(product.variants || []);
    setSelectedCategory(product.categoryId || '');
    setIsDialogOpen(true);
  };

  const addSpec = () => setSpecifications([...specifications, { key: '', value: '' }]);
  const removeSpec = (idx: number) => setSpecifications(specifications.filter((_, i) => i !== idx));
  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => {
    const next = [...specifications];
    next[idx][field] = val;
    setSpecifications(next);
  };

  const addVariant = () => setVariants([...variants, { name: '', options: [] }]);
  const updateVariant = (idx: number, name: string, optionsStr: string) => {
    const next = [...variants];
    next[idx].name = name;
    next[idx].options = optionsStr.split(',').map(o => o.trim()).filter(o => !!o);
    setVariants(next);
  };

  const addGalleryImage = (url: string) => {
    if (url && !galleryImages.includes(url)) {
      setGalleryImages([...galleryImages, url]);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Catalog Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Full Daraz-style SKU and inventory control</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="w-full md:w-auto gap-2 font-black shadow-lg h-11 px-8 rounded-xl bg-primary" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus size={18} /> Add New SKU
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active SKUs", val: products?.length || 0, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Low Stock (<5)", val: products?.filter(p => p.stockQuantity < 5).length || 0, icon: AlertCircle, bg: "bg-orange-50", color: "text-orange-600" },
          { label: "Out of Stock", val: products?.filter(p => p.stockQuantity === 0).length || 0, icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Total Category", val: categories?.length || 0, icon: Tag, bg: "bg-green-50", color: "text-green-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl shrink-0", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Product</TableHead>
                <TableHead className="font-bold">Category & Brand</TableHead>
                <TableHead className="font-bold">Price Details</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="text-right pr-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : products?.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border bg-gray-50 shrink-0">
                        {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] block leading-none mb-1">{product.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">SKU: {product.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px] w-fit">{product.categoryId}</Badge>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{product.brand || 'No Brand'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</span>
                      {product.regularPrice > product.price && <span className="text-[10px] text-gray-400 line-through">৳{product.regularPrice?.toLocaleString()}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black border-none",
                      product.stockQuantity === 0 ? "bg-red-50 text-red-600" :
                      product.stockQuantity < 5 ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                    )}>
                      {product.stockQuantity} UNITS
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(product)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'products', product.id))}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MULTI-TAB PRODUCT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col h-[85vh]">
            <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Package className="text-primary" /> {editingProduct ? 'Update SKU' : 'Catalog New Item'}
                </DialogTitle>
                <div className="flex bg-white/10 p-1 rounded-xl">
                  {['identity', 'media', 'specs', 'variants'].map(tab => (
                    <button 
                      key={tab} 
                      type="button" 
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                        activeTab === tab ? "bg-primary text-white" : "text-white/40 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-white custom-scrollbar">
              
              {/* TAB: IDENTITY */}
              {activeTab === 'identity' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Product Name</Label>
                        <Input name="name" defaultValue={editingProduct?.name} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sell Price</Label>
                          <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Regular Price</Label>
                          <Input name="regularPrice" type="number" defaultValue={editingProduct?.regularPrice} placeholder="0" className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Brand</Label>
                          <Input name="brand" defaultValue={editingProduct?.brand} placeholder="No Brand" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Quantity</Label>
                        <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rich Description (HTML Supported)</Label>
                    <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none rounded-2xl min-h-[250px] p-6 leading-relaxed" placeholder="<h1>Heading</h1><p>Product details...</p>" />
                  </div>
                </div>
              )}

              {/* TAB: MEDIA */}
              {activeTab === 'media' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUploader label="Main Feature Image" initialUrl={uploadedImageUrl} onUpload={setUploadedImageUrl} />
                    <div className="space-y-4">
                      <ImageUploader label="Add to Gallery" onUpload={addGalleryImage} />
                      <div className="grid grid-cols-4 gap-2">
                        {galleryImages.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                            <Image src={img} alt="Gallery" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SPECS */}
              {activeTab === 'specs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center px-2">
                    <Label className="text-sm font-black uppercase text-gray-900">Technical Data Points</Label>
                    <Button type="button" onClick={addSpec} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px] h-8"><Plus size={14} /> Add Row</Button>
                  </div>
                  <div className="space-y-3">
                    {specifications.map((spec, i) => (
                      <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <Input placeholder="Label (e.g. Model)" value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} className="bg-white border-none h-10 font-bold uppercase text-[10px]" />
                        <Input placeholder="Value (e.g. Galaxy S24)" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} className="bg-white border-none h-10 font-medium text-xs" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)} className="text-destructive"><Trash2 size={16} /></Button>
                      </div>
                    ))}
                    {specifications.length === 0 && <div className="py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground uppercase font-black text-[10px]">No specifications added</div>}
                  </div>
                </div>
              )}

              {/* TAB: VARIANTS */}
              {activeTab === 'variants' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center px-2">
                    <Label className="text-sm font-black uppercase text-gray-900">SKU Variations</Label>
                    <Button type="button" onClick={addVariant} size="sm" className="rounded-xl gap-2 font-black uppercase text-[10px] h-8"><Plus size={14} /> Add Type</Button>
                  </div>
                  <div className="space-y-4">
                    {variants.map((v, i) => (
                      <div key={i} className="space-y-3 bg-[#F8FAFC] p-6 rounded-[2rem] border border-blue-100">
                        <div className="flex justify-between items-center">
                          <Input placeholder="Variant Name (e.g. Color)" value={v.name} onChange={e => updateVariant(i, e.target.value, v.options.join(','))} className="bg-white border-none h-10 font-black uppercase text-[10px] w-[200px]" />
                          <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-destructive"><X size={16} /></Button>
                        </div>
                        <Input placeholder="Options separated by comma (e.g. Red, Blue, Green)" defaultValue={v.options.join(',')} onBlur={e => updateVariant(i, v.name, e.target.value)} className="bg-white border-none h-10 text-xs font-bold" />
                      </div>
                    ))}
                    {variants.length === 0 && <div className="py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground uppercase font-black text-[10px]">No product variants defined</div>}
                  </div>
                </div>
              )}

            </div>

            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border">
                  <Label className="text-[10px] font-black uppercase">Active</Label>
                  <Switch name="status" defaultChecked={editingProduct?.status === 'Active'} />
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border">
                  <Label className="text-[10px] font-black uppercase">Popular</Label>
                  <Switch name="isPopular" defaultChecked={editingProduct?.isPopular} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-8">Discard</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-12 h-12 bg-primary shadow-xl uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync SKU</>}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

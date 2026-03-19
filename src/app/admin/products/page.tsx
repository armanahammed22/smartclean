"use client";

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
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
  Image as ImageIcon, 
  Sparkles, 
  ListChecks, 
  Shapes,
  CheckCircle2
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

export default function ProductsManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media States
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Dynamic Fields States
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [variants, setVariants] = useState<{ name: string; options: string[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Data Queries (Auth Guarded to prevent transient permission errors)
  const productsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'product_categories')) : null, [db, user]);
  const brandsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'brands'), orderBy('name', 'asc')) : null, [db, user]);
  const variantTypesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'variant_types'), orderBy('name', 'asc')) : null, [db, user]);
  const reusableFeaturesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'reusable_features'), orderBy('name', 'asc')) : null, [db, user]);
  const reusableSpecsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'reusable_specs'), orderBy('key', 'asc')) : null, [db, user]);

  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: brands } = useCollection(brandsQuery);
  const { data: variantTypes } = useCollection(variantTypesQuery);
  const { data: reusableFeatures } = useCollection(reusableFeaturesQuery);
  const { data: reusableSpecs } = useCollection(reusableSpecsQuery);

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
      size: formData.get('size') as string || '',
      description: formData.get('description') as string,
      shortDescription: formData.get('shortDescription') as string,
      imageUrl: uploadedImageUrl || editingProduct?.imageUrl || '',
      galleryImages: galleryImages,
      status: formData.get('status') as string || 'Active',
      specifications: specifications.filter(s => s.key.trim() !== ''),
      features: features.filter(f => f.trim() !== ''),
      variants: variants.filter(v => v.name.trim() !== ''),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast({ title: "Product Updated" });
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });
        toast({ title: "Product Added" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast({ variant: "destructive", title: "Error saving product" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setUploadedImageUrl('');
    setGalleryImages([]);
    setSpecifications([]);
    setFeatures([]);
    setVariants([]);
    setSelectedCategory('');
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || '');
    setGalleryImages(product.galleryImages || []);
    setSpecifications(product.specifications || []);
    setFeatures(product.features || []);
    setVariants(product.variants || []);
    setSelectedCategory(product.categoryId || '');
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Handlers for Attributes
  const toggleFeature = (name: string) => {
    setFeatures(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const addSpecFromTemplate = (key: string) => {
    if (specifications.find(s => s.key === key)) return;
    setSpecifications([...specifications, { key, value: '' }]);
  };

  const addVariantFromTemplate = (vType: any) => {
    if (variants.find(v => v.name === vType.name)) return;
    setVariants([...variants, { name: vType.name, options: vType.options || [] }]);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">Control your cleaning equipment and supply catalog</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={handleOpenNew}>
              <Plus size={18} /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl w-[95vw] rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
            <form onSubmit={handleSave} className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Package className="text-primary" /> {editingProduct ? 'Edit Product Catalog' : 'Add New Inventory Item'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <ImageIcon size={14} /> Primary Product Photo
                      </Label>
                      <ImageUploader 
                        initialUrl={uploadedImageUrl}
                        aspectRatio="aspect-square"
                        onUpload={setUploadedImageUrl}
                        label=""
                      />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gallery</Label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 group shrink-0">
                            <Image src={img} alt="Gallery" fill className="object-cover" />
                            <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                      <Input placeholder="Paste image URL..." onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (val) { setGalleryImages([...galleryImages, val]); (e.target as HTMLInputElement).value = ''; }
                        }
                      }} className="h-9 text-xs" />
                    </div>
                  </div>

                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Product Name</Label>
                        <Input name="name" defaultValue={editingProduct?.name} required placeholder="Product Title" className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sale Price (BDT)</Label>
                        <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Regular Price</Label>
                        <Input name="regularPrice" type="number" defaultValue={editingProduct?.regularPrice} className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stock</Label>
                        <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Brand</Label>
                        <Select name="brand" defaultValue={editingProduct?.brand || "General"}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            {brands?.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                          <SelectContent>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Short Summary</Label>
                      <Input name="shortDescription" defaultValue={editingProduct?.shortDescription} placeholder="Quick highlight" className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* MODULE: VARIANTS */}
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Shapes size={18} /> Variants</Label>
                    <div className="flex gap-2">
                      <Select onValueChange={(val) => {
                        const vt = variantTypes?.find(v => v.id === val);
                        if (vt) addVariantFromTemplate(vt);
                      }}>
                        <SelectTrigger className="h-8 w-[150px] text-[10px] font-bold uppercase"><SelectValue placeholder="Load Type" /></SelectTrigger>
                        <SelectContent>{variantTypes?.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { name: '', options: [] }])} className="h-8 rounded-lg font-bold text-[10px] uppercase border-primary/20 text-primary">
                        <Plus size={14} /> Custom
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variants.map((v, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                        <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        <Input value={v.name} onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].name = e.target.value;
                          setVariants(updated);
                        }} placeholder="Variant Type (e.g. Size)" className="h-9 text-xs font-bold" />
                        <Input value={v.options.join(', ')} onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].options = e.target.value.split(',').map(o => o.trim()).filter(o => !!o);
                          setVariants(updated);
                        }} placeholder="Options: Large, Small" className="h-9 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODULE: KEY FEATURES */}
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><ListChecks size={18} /> Features</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFeatures([...features, ''])} className="h-8 rounded-lg font-bold text-[10px] uppercase border-primary/20 text-primary">
                      <Plus size={14} /> Add Manual
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {reusableFeatures?.map(f => (
                      <div key={f.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => toggleFeature(f.name)}>
                        <Checkbox checked={features.includes(f.name)} />
                        <span className="text-[11px] font-bold text-gray-600 uppercase truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 mt-4">
                    {features.filter(f => !reusableFeatures?.some(rf => rf.name === f)).map((f, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={f} onChange={(e) => {
                          const updated = [...features];
                          updated[idx] = e.target.value;
                          setFeatures(updated);
                        }} className="h-10 text-xs bg-gray-50 border-none rounded-xl" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setFeatures(features.filter((_, i) => i !== idx))}><Trash2 size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODULE: SPECIFICATIONS */}
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><Settings2 size={18} /> Technical Specs</Label>
                    <div className="flex gap-2">
                      <Select onValueChange={addSpecFromTemplate}>
                        <SelectTrigger className="h-8 w-[150px] text-[10px] font-bold uppercase"><SelectValue placeholder="Add Key" /></SelectTrigger>
                        <SelectContent>{reusableSpecs?.map(s => <SelectItem key={s.id} value={s.key}>{s.key}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} className="h-8 rounded-lg font-bold text-[10px] uppercase border-primary/20 text-primary">
                        <Plus size={14} /> Custom
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specifications.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 items-end bg-gray-50 p-3 rounded-2xl border border-gray-100 group relative">
                        <button type="button" onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                        <div className="flex-1 space-y-1.5">
                          <Input value={spec.key} onChange={(e) => {
                            const updated = [...specifications];
                            updated[idx].key = e.target.value;
                            setSpecifications(updated);
                          }} placeholder="Key" className="h-8 text-xs font-bold bg-white" />
                          <Input value={spec.value} onChange={(e) => {
                            const updated = [...specifications];
                            updated[idx].value = e.target.value;
                            setSpecifications(updated);
                          }} placeholder="Value" className="h-8 text-xs bg-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-6">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Product Description</Label>
                  <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none min-h-[150px] rounded-2xl p-4" placeholder="Detailed features..." />
                </div>
              </div>

              <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 bg-primary hover:bg-primary/90 shadow-xl uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                  Save Product Information
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Product Name</TableHead>
                <TableHead className="font-bold">Brand/Category</TableHead>
                <TableHead className="font-bold">Pricing</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">Syncing inventory...</TableCell></TableRow>
              ) : products?.length ? (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 shrink-0">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={16} /></div>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 uppercase text-[11px] leading-tight max-w-[200px] truncate">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700">{product.brand || 'No Brand'}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{product.categoryId || 'General'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</div>
                      {product.regularPrice > 0 && <div className="text-[10px] text-muted-foreground line-through decoration-red-200">৳{product.regularPrice.toLocaleString()}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black border-none px-2 py-0.5 rounded-md",
                        product.stockQuantity < 5 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {product.stockQuantity || 0} Units
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-black uppercase border-none px-2.5 py-1 rounded-full",
                        product.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleOpenEdit(product)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => deleteDoc(doc(db!, 'products', product.id))}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground">No products found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
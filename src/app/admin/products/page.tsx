
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  ImageIcon, 
  Sparkles, 
  ListChecks, 
  Shapes,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star
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

  // Data Queries
  const productsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'categories')) : null, [db, user]);
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

  const stats = useMemo(() => {
    if (!products) return { total: 0, outOfStock: 0, active: 0, bestSelling: 0 };
    return {
      total: products.length,
      outOfStock: products.filter(p => (p.stockQuantity || 0) <= 0).length,
      active: products.filter(p => p.status === 'Active').length,
      bestSelling: products.filter(p => p.isBestSelling).length
    };
  }, [products]);

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
      shortDescription: formData.get('shortDescription') as string,
      imageUrl: uploadedImageUrl || editingProduct?.imageUrl || '',
      galleryImages: galleryImages,
      status: formData.get('status') as string || 'Active',
      isBestSelling: formData.get('isBestSelling') === 'on',
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

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">Control products and best-selling status</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus size={18} /> Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", val: stats.total, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Out of Stock", val: stats.outOfStock, icon: AlertCircle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Best Selling", val: stats.bestSelling, icon: Star, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Published", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Product Name</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="font-bold">Best Selling</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Syncing inventory...</TableCell></TableRow>
              ) : products?.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 shrink-0">
                        {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill className="object-cover" /> : <Package size={16} />}
                      </div>
                      <span className="font-bold text-gray-900 uppercase text-[11px] leading-tight truncate">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px] font-black border-none", product.stockQuantity <= 0 ? "bg-red-50 text-red-600" : "bg-gray-100")}>
                      {product.stockQuantity || 0} Units
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch checked={!!product.isBestSelling} onCheckedChange={async (val) => await updateDoc(doc(db!, 'products', product.id), { isBestSelling: val })} />
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenEdit(product)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'products', product.id))}><Trash2 size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-8 bg-[#081621] text-white shrink-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Package className="text-primary" /> {editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <ImageUploader label="Primary Image" initialUrl={uploadedImageUrl} onUpload={setUploadedImageUrl} />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Product Name</Label>
                    <Input name="name" defaultValue={editingProduct?.name} required className="h-12 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Price</Label>
                      <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Stock</Label>
                      <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <Label className="text-xs font-bold">Best Selling Highlight</Label>
                    <Checkbox name="isBestSelling" defaultChecked={editingProduct?.isBestSelling} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Description</Label>
                <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none rounded-2xl min-h-[120px]" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 bg-primary hover:bg-primary/90 shadow-xl uppercase tracking-tighter">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />} Save Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

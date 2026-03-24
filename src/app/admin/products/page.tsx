"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Eye
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
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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

  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: brands } = useCollection(brandsQuery);

  const stats = useMemo(() => {
    if (!products) return { total: 0, outOfStock: 0, active: 0, bestSelling: 0 };
    return {
      total: products.length,
      outOfStock: products.filter(p => (p.stockQuantity || 0) <= 0).length,
      active: products.filter(p => p.status === 'Active').length,
      bestSelling: products.filter(p => p.isBestSelling).length
    };
  }, [products]);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === products?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products?.map(p => p.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'products', id));
      });
      await batch.commit();
      toast({ title: "Bulk Delete Successful", description: `${selectedIds.length} items removed.` });
      setSelectedIds([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      status: formData.get('status') as string || 'Active',
      isBestSelling: formData.get('isBestSelling') === 'on',
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
    setSelectedCategory(product.categoryId || '');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Product Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Add, edit and monitor your inventory status</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2 font-black uppercase text-[10px]">
              <Trash2 size={14} /> Delete ({selectedIds.length})
            </Button>
          )}
          <Button className="w-full md:w-auto gap-2 font-bold shadow-lg h-11 px-6 rounded-xl" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus size={18} /> New Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", val: stats.total, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Out of Stock", val: stats.outOfStock, icon: AlertCircle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Best Selling", val: stats.bestSelling, icon: Star, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Published", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" }
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

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={products?.length > 0 && selectedIds.length === products?.length} 
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5">Product Identity</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="font-bold">Inventory</TableHead>
                  <TableHead className="font-bold">Best Selling</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
                ) : products?.map((product) => (
                  <TableRow key={product.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(product.id) && "bg-primary/5")}>
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(product.id)} 
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 shrink-0">
                          {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized /> : <Package size={16} />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 uppercase text-[11px] leading-tight truncate max-w-[200px]">{product.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono mt-0.5">ID: {product.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] font-black border-none", (product.stockQuantity || 0) <= 0 ? "bg-red-50 text-red-600" : "bg-gray-100")}>
                        {product.stockQuantity || 0} Units
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!product.isBestSelling} onCheckedChange={async (val) => await updateDoc(doc(db!, 'products', product.id), { isBestSelling: val })} />
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setViewingProduct(product)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => handleOpenEdit(product)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => deleteDoc(doc(db!, 'products', product.id))}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* QUICK VIEW DIALOG */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">{viewingProduct?.name}</DialogTitle>
            <Badge className="bg-primary text-white border-none">{viewingProduct?.status}</Badge>
          </DialogHeader>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border">
              {viewingProduct?.imageUrl ? (
                <Image src={viewingProduct.imageUrl} alt="Preview" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><Package size={80} /></div>
              )}
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pricing & Inventory</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">৳{viewingProduct?.price?.toLocaleString()}</span>
                  {viewingProduct?.regularPrice > viewingProduct?.price && (
                    <span className="text-sm text-gray-400 line-through">৳{viewingProduct?.regularPrice?.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-600 mt-2 flex items-center gap-2">
                  <Package size={14} className="text-gray-400" /> Stock: {viewingProduct?.stockQuantity} Units
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description</p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-6">{viewingProduct?.description || 'No description available.'}</p>
              </div>
              <div className="pt-4 border-t flex gap-3">
                <Button className="flex-1 font-bold" onClick={() => { setViewingProduct(null); handleOpenEdit(viewingProduct); }}>Edit Item</Button>
                <Button variant="outline" className="flex-1 font-bold" onClick={() => setViewingProduct(null)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-t-[2rem] md:rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2"><Package className="text-primary" /> {editingProduct ? 'Update Inventory' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <ImageUploader label="Primary Product Photo" initialUrl={uploadedImageUrl} onUpload={setUploadedImageUrl} />
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                    <Input name="name" defaultValue={editingProduct?.name} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sale Price</Label>
                      <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Stock</Label>
                      <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department / Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase text-amber-900">Featured Highlight</Label>
                      <p className="text-[9px] font-bold text-amber-700">DISPLAY ON HOMEPAGE JUST FOR YOU</p>
                    </div>
                    <Switch name="isBestSelling" defaultChecked={editingProduct?.isBestSelling} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detailed Description</Label>
                <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none rounded-2xl min-h-[120px] p-4" />
              </div>
            </div>
            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex-col sm:flex-row gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 bg-primary hover:bg-primary/90 shadow-xl uppercase tracking-tighter w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />} Sync Inventory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

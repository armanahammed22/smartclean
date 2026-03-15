
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2, Edit, Tag, ShoppingCart, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProductsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('name', 'asc'));
  }, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      stockQuantity: parseInt(formData.get('stockQuantity') as string),
      categoryId: formData.get('categoryId') as string,
      description: formData.get('description') as string,
      imageUrl: formData.get('imageUrl') as string,
      status: 'Active',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        updateDoc(doc(db, 'products', editingProduct.id), productData).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `products/${editingProduct.id}`, operation: 'update', requestResourceData: productData }));
        });
        toast({ title: "Product Updated" });
      } else {
        addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() }).catch(err => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: productData }));
        });
        toast({ title: "Product Added" });
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error saving product" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'products', id)).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `products/${id}`, operation: 'delete' }));
    });
    toast({ title: "Product Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Products</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning supplies and equipment catalog</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingProduct(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input name="name" defaultValue={editingProduct?.name} required placeholder="e.g. Industrial Vacuum" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (BDT)</Label>
                      <Input name="price" type="number" defaultValue={editingProduct?.price} required placeholder="5000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Quantity</Label>
                      <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required placeholder="10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="categoryId" defaultValue={editingProduct?.categoryId || ""}>
                      <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <ImageUploader 
                    label="Product Image"
                    initialUrl={editingProduct?.imageUrl}
                    onUpload={(url) => {
                      const input = document.getElementById('product-image-url') as HTMLInputElement;
                      if(input) input.value = url;
                    }}
                  />
                  <input type="hidden" name="imageUrl" id="product-image-url" defaultValue={editingProduct?.imageUrl} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingProduct?.description} className="min-h-[100px]" placeholder="Detailed product features..." />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-24 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-muted-foreground font-medium">Loading inventory...</span>
          </div>
        ) : products?.length ? (
          products.map((product) => (
            <Card key={product.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white flex flex-col h-full">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 border-b">
                {product.imageUrl ? (
                  <Image 
                    src={product.imageUrl} 
                    alt={product.name || 'Product Image'} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Package size={48} />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-white/95 text-primary border-none text-[8px] font-black shadow-sm uppercase tracking-tighter">
                  {categories?.find(c => c.id === product.categoryId)?.name || 'GENERAL'}
                </Badge>
              </div>
              
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm md:text-base font-bold line-clamp-1 text-gray-900">{product.name}</CardTitle>
                <div className="text-primary font-black text-lg">
                  ৳{product.price?.toLocaleString()}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 space-y-4 flex-1">
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                  {product.description || 'Professional equipment for deep cleaning and maintenance.'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-[9px] font-black uppercase tracking-wider text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-primary" /> Stock: {product.stockQuantity || 0}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart size={12} className="text-primary" /> Sold: {product.soldCount || 0}
                  </div>
                </div>
              </CardContent>
              
              <div className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-9 text-[10px] font-bold uppercase" onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                  <Edit size={12} /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-lg shrink-0" onClick={() => handleDelete(product.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-24 border-2 border-dashed rounded-3xl text-muted-foreground italic bg-white">
            <Package size={40} className="mx-auto mb-4 opacity-10" />
            No products in your catalog yet.
          </div>
        )}
      </div>
    </div>
  );
}

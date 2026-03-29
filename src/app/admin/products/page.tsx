'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Tag, 
  Loader2, 
  Save, 
  X, 
  AlertCircle, 
  XCircle,
  Eye,
  Settings2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLanguage } from '@/components/providers/language-provider';

export default function ProductsManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('identity');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const productsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'categories')) : null, [db, user]);
  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);

  const stats = useMemo(() => {
    if (!products) return { total: 0, low: 0, out: 0, cats: 0 };
    return {
      total: products.length,
      low: products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length,
      out: products.filter(p => p.stockQuantity <= 0).length,
      cats: categories?.length || 0
    };
  }, [products, categories]);

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
    if (!confirm("Delete selected items?")) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'products', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Delete Completed" });
    } catch (e) {} finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
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
      badgeText: formData.get('badgeText') as string || '',
      description: formData.get('description') as string,
      imageUrl: uploadedImageUrl || editingProduct?.imageUrl || '',
      specifications: specifications,
      status: formData.get('status') === 'on' ? 'Active' : 'Inactive',
      isPopular: formData.get('isPopular') === 'on',
      updatedAt: new Date().toISOString()
    };

    const promise = editingProduct 
      ? updateDoc(doc(db, 'products', editingProduct.id), productData)
      : addDoc(collection(db, 'products'), { ...productData, createdAt: new Date().toISOString() });

    promise
      .then(() => {
        toast({ title: editingProduct ? "Inventory Updated" : "Product Catalogued" });
        setIsDialogOpen(false);
        resetForm();
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: editingProduct ? `products/${editingProduct.id}` : 'products',
          operation: editingProduct ? 'update' : 'create',
          requestResourceData: productData
        }));
      })
      .finally(() => setIsSubmitting(false));
  };

  const resetForm = () => {
    setEditingProduct(null);
    setUploadedImageUrl('');
    setSpecifications([]);
    setSelectedCategory('');
    setActiveTab('identity');
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || '');
    setSpecifications(product.specifications || []);
    setSelectedCategory(product.categoryId || '');
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Inventory Catalog</h1>
          <p className="text-muted-foreground text-sm">Full SKU and inventory control center</p>
        </div>
        <Button className="w-full md:w-auto gap-2 font-black shadow-lg h-11 px-8 rounded-xl bg-primary" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus size={18} /> {t('new_sku')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active SKUs", val: stats.total, icon: Package, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Low Stock", val: stats.low, icon: AlertCircle, bg: "bg-orange-50", color: "text-orange-600" },
          { label: "Out of Stock", val: stats.out, icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
          { label: "Taxonomies", val: stats.cats, icon: Tag, bg: "bg-green-50", color: "text-green-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={products?.length ? selectedIds.length === products.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Product</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Category</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Price</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Stock</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
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
                    <TableCell className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border bg-gray-50 shrink-0">
                          {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] block leading-none mb-1">{product.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">SKU: {product.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px]">{product.categoryId}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] font-black border-none", product.stockQuantity === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] rounded-t-[2rem] md:rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <form onSubmit={handleSave} className="flex flex-col h-[85vh]">
            <DialogHeader className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Package className="text-primary" /> {editingProduct ? 'Update SKU' : 'Catalog New Item'}
                </DialogTitle>
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/10 p-1 rounded-xl">
                    {['identity', 'media', 'specs'].map(tab => (
                      <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("px-3 md:px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", activeTab === tab ? "bg-primary text-white" : "text-white/40 hover:text-white")}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 bg-white custom-scrollbar">
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
                          <Input name="regularPrice" type="number" defaultValue={editingProduct?.regularPrice} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Quantity</Label>
                        <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) || (
                                ['Cleaning', 'Maintenance', 'Tools'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Badge Text (Optional)</Label>
                          <Input name="badgeText" defaultValue={editingProduct?.badgeText} placeholder="e.g. HOT" className="h-12 bg-gray-50 border-none rounded-xl font-black uppercase text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                    <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none rounded-2xl min-h-[250px] p-6 leading-relaxed" />
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <ImageUploader 
                    label="Primary Display Image" 
                    hint="800 x 800 px (1:1 Square)"
                    initialUrl={uploadedImageUrl} 
                    onUpload={setUploadedImageUrl} 
                    aspectRatio="aspect-square"
                  />
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-black uppercase text-gray-900">Specifications</Label>
                    <Button type="button" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} size="sm" className="rounded-xl font-black text-[10px] h-8">+ Add Row</Button>
                  </div>
                  <div className="space-y-3">
                    {specifications.map((spec, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 relative">
                        <Input placeholder="Label" value={spec.key} onChange={e => {
                          const next = [...specifications];
                          next[i].key = e.target.value;
                          setSpecifications(next);
                        }} className="bg-white border-none h-10 font-bold uppercase text-[10px] flex-1" />
                        <Input placeholder="Value" value={spec.value} onChange={e => {
                          const next = [...specifications];
                          next[i].value = e.target.value;
                          setSpecifications(next);
                        }} className="bg-white border-none h-10 font-medium text-xs flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))} className="text-destructive shrink-0"><Trash2 size={16} /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border w-full sm:w-auto justify-between">
                <Label className="text-[10px] font-black uppercase">Active</Label>
                <Switch name="status" defaultChecked={editingProduct?.status === 'Active'} />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-[10px] tracking-widest px-8">Discard</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none rounded-xl font-black px-12 h-12 bg-primary shadow-xl uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />} Sync SKU
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

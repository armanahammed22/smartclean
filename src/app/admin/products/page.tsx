
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
  Settings2,
  FolderTree
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  
  // Dynamic Dropdown States
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('');
  const [selectedChildCatId, setSelectedChildCatId] = useState<string>('');

  // Master Data Queries
  const productsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  const subCategoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'subcategories'), orderBy('name', 'asc')) : null, [db, user]);
  const childCategoriesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'childcategories'), orderBy('name', 'asc')) : null, [db, user]);
  const brandsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'brands'), orderBy('name', 'asc')) : null, [db, user]);
  const specTemplatesQuery = useMemoFirebase(() => db ? query(collection(db, 'reusable_specs'), orderBy('key', 'asc')) : null, [db]);
  const attributesQuery = useMemoFirebase(() => db ? query(collection(db, 'master_attributes'), orderBy('label', 'asc')) : null, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: subcategories } = useCollection(subCategoriesQuery);
  const { data: childcategories } = useCollection(childCategoriesQuery);
  const { data: brands } = useCollection(brandsQuery);
  const { data: specTemplates } = useCollection(specTemplatesQuery);
  const { data: masterAttributes } = useCollection(attributesQuery);

  const productUnits = useMemo(() => masterAttributes?.filter(a => a.group === 'product_unit') || [], [masterAttributes]);
  const productBadges = useMemo(() => masterAttributes?.filter(a => a.group === 'product_badge') || [], [masterAttributes]);

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
    const name = formData.get('name') as string;
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const productData = {
      name: name,
      slug: slug,
      price: parseFloat(formData.get('price') as string),
      regularPrice: parseFloat(formData.get('regularPrice') as string) || 0,
      stockQuantity: parseInt(formData.get('stockQuantity') as string),
      categoryId: selectedCatId,
      subCategoryId: selectedSubCatId,
      childCategoryId: selectedChildCatId,
      brand: formData.get('brand') as string || 'General',
      badgeText: formData.get('badgeText') as string || '',
      unitType: formData.get('unitType') as string || 'Piece',
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
    setSelectedCatId('');
    setSelectedSubCatId('');
    setSelectedChildCatId('');
    setActiveTab('identity');
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || '');
    setSpecifications(product.specifications || []);
    setSelectedCatId(product.categoryId || '');
    setSelectedSubCatId(product.subCategoryId || '');
    setSelectedChildCatId(product.childCategoryId || '');
    setIsDialogOpen(true);
  };

  const availableSubs = useMemo(() => subcategories?.filter(s => s.categoryId === selectedCatId) || [], [subcategories, selectedCatId]);
  const availableChildren = useMemo(() => childcategories?.filter(c => c.subcategoryId === selectedSubCatId) || [], [childcategories, selectedSubCatId]);

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
            <Table>
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
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                          {product.imageUrl && <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] block leading-none mb-1">{product.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">SLUG: {product.slug || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px]">
                        {categories?.find(c => c.id === product.categoryId)?.name || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] font-black border-none", product.stockQuantity === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
                        {product.stockQuantity} {product.unitType || 'UNITS'}
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
        <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col bg-white overflow-hidden">
          <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-6 md:p-8 bg-[#081621] text-white shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Package className="text-primary" size={24} /> {editingProduct ? 'Update SKU' : 'Catalog New Item'}
                  </DialogTitle>
                  <DialogDescription className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Configure identity and taxonomy hierarchy</DialogDescription>
                </div>
                <div className="flex bg-white/10 p-1 rounded-xl">
                  {['identity', 'media', 'specs'].map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", activeTab === tab ? "bg-primary text-white" : "text-white/40 hover:text-white")}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-white">
              {activeTab === 'identity' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Name</Label>
                        <Input name="name" defaultValue={editingProduct?.name} required className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sell Price</Label>
                          <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unit Type</Label>
                          <Select name="unitType" defaultValue={editingProduct?.unitType || 'Piece'}>
                            <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {productUnits.map(u => <SelectItem key={u.id} value={u.label}>{u.label}</SelectItem>) || <SelectItem value="Piece">Piece</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Stock Qty</Label>
                          <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Assigned Brand</Label>
                          <Select name="brand" defaultValue={editingProduct?.brand || 'General'}>
                            <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {brands?.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>) || <SelectItem value="General">General</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Highlight Badge</Label>
                        <Select name="badgeText" defaultValue={editingProduct?.badgeText || ''}>
                          <SelectTrigger className="h-11 md:h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue placeholder="No Badge" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">None</SelectItem>
                            {productBadges.map(b => <SelectItem key={b.id} value={b.label}>{b.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-6 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                      <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><FolderTree size={14}/> Taxonomy Mapping</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase">Level 1 (Main Category)</Label>
                          <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSelectedSubCatId(''); setSelectedChildCatId(''); }}>
                            <SelectTrigger className="h-10 bg-white border-none rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                            <SelectContent>
                              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase">Level 2 (Sub-Category)</Label>
                          <Select value={selectedSubCatId} onValueChange={(v) => { setSelectedSubCatId(v); setSelectedChildCatId(''); }} disabled={!selectedCatId}>
                            <SelectTrigger className="h-10 bg-white border-none rounded-xl"><SelectValue placeholder="Select Sub-Category" /></SelectTrigger>
                            <SelectContent>
                              {availableSubs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase">Level 3 (Child-Category)</Label>
                          <Select value={selectedChildCatId} onValueChange={setSelectedChildCatId} disabled={!selectedSubCatId}>
                            <SelectTrigger className="h-10 bg-white border-none rounded-xl"><SelectValue placeholder="Select Child-Category" /></SelectTrigger>
                            <SelectContent>
                              {availableChildren.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                    <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none rounded-2xl min-h-[150px] p-6 leading-relaxed" />
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 max-w-2xl mx-auto">
                  <ImageUploader label="Primary Product Media" hint="800 x 800 px (1:1 Square)" initialUrl={uploadedImageUrl} onUpload={setUploadedImageUrl} aspectRatio="aspect-square" />
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-sm font-black uppercase text-gray-900 tracking-tight">Technical Matrix</Label>
                    <Button type="button" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} size="sm" className="rounded-xl font-black text-[10px] h-9 px-4 uppercase">+ Add Property</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specifications.map((spec, i) => (
                      <div key={i} className="flex gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                        <Select value={spec.key} onValueChange={v => { const next = [...specifications]; next[i].key = v; setSpecifications(next); }}>
                          <SelectTrigger className="h-10 bg-white border-none rounded-lg text-[10px] font-bold uppercase flex-1"><SelectValue placeholder="Prop Label" /></SelectTrigger>
                          <SelectContent>
                            {specTemplates?.map(t => <SelectItem key={t.id} value={t.key} className="text-[10px] font-bold uppercase">{t.key}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input placeholder="Value (e.g. 500W)" value={spec.value} onChange={e => { const next = [...specifications]; next[i].value = e.target.value; setSpecifications(next); }} className="h-10 bg-white border-none rounded-lg text-xs flex-1" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))} className="text-destructive h-10 w-10"><Trash2 size={14} /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border w-full sm:w-auto justify-between shadow-sm">
                <Label className="text-[10px] font-black uppercase text-gray-500">Public Status</Label>
                <Switch name="status" defaultChecked={editingProduct?.status === 'Active'} />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none h-12 md:h-14 px-12 rounded-xl font-black bg-primary shadow-xl shadow-primary/20 uppercase tracking-tighter transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Records</>}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

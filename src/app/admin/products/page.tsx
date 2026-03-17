
"use client";

import React, { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2, Edit, Tag, ShoppingCart, Loader2, Save, Layers, Wrench, Users, Settings2, X, Image as ImageIcon } from 'lucide-react';
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

const CATEGORY_SPECS: Record<string, string[]> = {
  'Cleaning': ['Concentration', 'pH Level', 'Fragrance', 'Volume', 'Surface Compatibility'],
  'Tools': ['Material', 'Power Source', 'Voltage', 'Weight', 'Warranty Period'],
  'Electronics': ['Battery Capacity', 'Connectivity', 'Model Year', 'Certification'],
  'General': ['Manufacturer', 'Origin', 'Material', 'Color']
};

export default function ProductsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media States
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Specifications State
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Data Queries
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), orderBy('name', 'asc')) : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'product_categories')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services')) : null, [db]);
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services')) : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles')) : null, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: subServices } = useCollection(subServicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  // Auto-populate specs based on category
  useEffect(() => {
    if (isDialogOpen && !editingProduct && selectedCategory) {
      const suggestedKeys = CATEGORY_SPECS[selectedCategory] || CATEGORY_SPECS['General'];
      setSpecs(suggestedKeys.map(key => ({ key, value: '' })));
    }
  }, [selectedCategory, isDialogOpen, editingProduct]);

  const KPI_STATS = [
    { label: "Total Products", value: products?.length || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Services", value: services?.length || 0, icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Sub-Services", value: subServices?.length || 0, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Staff", value: employees?.length || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

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
      specs: specs.filter(s => s.key.trim() !== ''),
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
    setSpecs([]);
    setSelectedCategory('');
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setUploadedImageUrl(product.imageUrl || '');
    setGalleryImages(product.galleryImages || []);
    setSpecs(product.specs || []);
    setSelectedCategory(product.categoryId || '');
    setIsDialogOpen(true);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addSpecField = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecField = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  };

  const addToGallery = (url: string) => {
    if (url && !galleryImages.includes(url)) {
      setGalleryImages([...galleryImages, url]);
    }
  };

  const removeFromGallery = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
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
                  {/* LEFT COLUMN: MEDIA */}
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
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Gallery</Label>
                        <Badge variant="outline" className="text-[9px] font-bold opacity-60 uppercase">{galleryImages.length} Photos</Badge>
                      </div>
                      
                      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar min-h-[100px] items-center">
                        {galleryImages.map((img, idx) => (
                          <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-100 shrink-0 group">
                            <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeFromGallery(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50 shrink-0">
                          <ImageIcon size={24} className="text-gray-300" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground italic">Add extra angles or detail shots:</p>
                        <div className="flex gap-2">
                          <Input 
                            id="prod-gallery-input"
                            placeholder="Paste image URL..." 
                            className="h-10 bg-gray-50 border-gray-100 text-xs" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value;
                                if (val) {
                                  addToGallery(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="h-10 px-4 font-bold"
                            onClick={() => {
                              const input = document.getElementById('prod-gallery-input') as HTMLInputElement;
                              if (input.value) {
                                addToGallery(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: CORE DATA */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Product Name</Label>
                        <Input name="name" defaultValue={editingProduct?.name} required placeholder="e.g. Industrial Vacuum" className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Price (BDT)</Label>
                        <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Reg. Price</Label>
                        <Input name="regularPrice" type="number" defaultValue={editingProduct?.regularPrice} className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Stock Qty</Label>
                        <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Unit/Size</Label>
                        <Input name="size" defaultValue={editingProduct?.size} placeholder="e.g. 5L, 1kg" className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cleaning">Cleaning Supplies</SelectItem>
                            <SelectItem value="Tools">Equipment & Tools</SelectItem>
                            <SelectItem value="Electronics">Gadgets & Tech</SelectItem>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Brand</Label>
                        <Input name="brand" defaultValue={editingProduct?.brand} placeholder="e.g. Samsung" className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Short Description</Label>
                      <Input name="shortDescription" defaultValue={editingProduct?.shortDescription} placeholder="Quick summary..." className="h-12 bg-gray-50 border-none focus:bg-white rounded-xl" />
                    </div>
                  </div>
                </div>

                {/* DYNAMIC EXTRA SPECIFICATIONS SECTION */}
                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="text-primary" size={20} />
                      <Label className="text-sm font-black uppercase tracking-tight">Technical Specifications</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addSpecField} className="h-8 rounded-lg font-bold gap-1 text-[10px] uppercase border-primary/20 text-primary">
                      <Plus size={14} /> Add Extra Specification
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specs.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 items-end animate-in fade-in slide-in-from-top-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <div className="flex-1 space-y-1.5">
                          <Input 
                            value={spec.key} 
                            onChange={(e) => updateSpec(idx, 'key', e.target.value)} 
                            placeholder="Specification Name (e.g. Battery)"
                            className="h-9 text-xs font-bold bg-white border-gray-200"
                          />
                          <Input 
                            value={spec.value} 
                            onChange={(e) => updateSpec(idx, 'value', e.target.value)} 
                            placeholder="Value (e.g. 5000mAh)"
                            className="h-9 text-xs bg-white border-gray-200"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeSpecField(idx)} 
                          className="h-9 w-9 text-destructive hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {specs.length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed rounded-3xl text-muted-foreground text-xs italic">
                        No extra specifications added.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-6">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Full Product Description</Label>
                  <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none focus:bg-white min-h-[150px] rounded-2xl p-4" placeholder="Detailed features, how to use, etc..." />
                </div>
              </div>

              <DialogFooter className="p-8 bg-gray-50 border-t shrink-0">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-10 h-12 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2" />}
                  Save Product Information
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{stat.label}</p>
                <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
              </div>
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
                  <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-bold text-gray-900 py-5 pl-8 uppercase text-xs">{product.name}</TableCell>
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
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleOpenEdit(product)}>
                          <Edit size={14} />
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

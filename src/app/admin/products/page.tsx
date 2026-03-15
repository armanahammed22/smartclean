"use client";

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, Trash2, Edit, Tag, ShoppingCart, Loader2, Save, Layers, Wrench, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProductsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      categoryId: formData.get('categoryId') as string,
      brand: formData.get('brand') as string || 'General',
      description: formData.get('description') as string,
      shortDescription: formData.get('shortDescription') as string,
      status: formData.get('status') as string || 'Active',
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
      setEditingProduct(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error saving product" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this product?")) return;
    await deleteDoc(doc(db, 'products', id));
    toast({ title: "Product Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">Control your cleaning equipment and supply catalog</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingProduct(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-3xl">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Product Name</Label>
                    <Input name="name" defaultValue={editingProduct?.name} required placeholder="e.g. Industrial Vacuum" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Price (BDT)</Label>
                      <Input name="price" type="number" defaultValue={editingProduct?.price} required className="h-11 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reg. Price</Label>
                      <Input name="regularPrice" type="number" defaultValue={editingProduct?.regularPrice} className="h-11 bg-gray-50 border-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stock Qty</Label>
                      <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-11 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Brand</Label>
                      <Input name="brand" defaultValue={editingProduct?.brand} placeholder="e.g. LG" className="h-11 bg-gray-50 border-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Category</Label>
                    <Select name="categoryId" defaultValue={editingProduct?.categoryId || ""}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Short Description</Label>
                    <Input name="shortDescription" defaultValue={editingProduct?.shortDescription} placeholder="Brief summary" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Description</Label>
                    <Textarea name="description" defaultValue={editingProduct?.description} className="bg-gray-50 border-none min-h-[100px]" placeholder="Key features and details..." />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-bold px-8">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Product
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
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
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
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">Syncing inventory...</TableCell></TableRow>
              ) : products?.length ? (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-bold text-gray-900 py-5 pl-8">{product.name}</TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-gray-700">{product.brand || 'No Brand'}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{categories?.find(c => c.id === product.categoryId)?.name || 'General'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-black text-primary text-sm">৳{product.price?.toLocaleString()}</div>
                      {product.regularPrice > 0 && <div className="text-[10px] text-muted-foreground line-through decoration-red-200">৳{product.regularPrice.toLocaleString()}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black border-none px-2 py-0.5",
                        product.stockQuantity < 5 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {product.stockQuantity || 0} Units
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-black uppercase border-none",
                        product.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => handleDelete(product.id)}>
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

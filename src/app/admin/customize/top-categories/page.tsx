
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, List, MoveUp, MoveDown, Loader2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TopCategoriesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', link: '', order: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'top_nav_categories'), orderBy('order', 'asc')) : null, [db]);
  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.name) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'top_nav_categories'), {
        ...formData,
        order: Number(formData.order) || (categories?.length || 0) + 1
      });
      setFormData({ name: '', link: '', order: 0 });
      toast({ title: "Category Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this category from the top nav?")) return;
    await deleteDoc(doc(db, 'top_nav_categories', id));
    toast({ title: "Category Removed" });
  };

  const updateOrder = async (id: string, newOrder: number) => {
    if (!db) return;
    await updateDoc(doc(db, 'top_nav_categories', id), { order: newOrder });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Top Navigation Categories</h1>
        <p className="text-muted-foreground text-sm">Manage the horizontal list of links above the hero slider</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add Navigation Link</CardTitle>
            <CardDescription>Create a shortcut for the top bar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Category Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Laptop" 
                  className="h-11 bg-gray-50 border-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Redirection Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <Input 
                    value={formData.link} 
                    onChange={e => setFormData({...formData, link: e.target.value})} 
                    placeholder="/services?category=Laptop" 
                    className="h-11 pl-10 bg-gray-50 border-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Display Order</Label>
                <Input 
                  type="number" 
                  value={formData.order} 
                  onChange={e => setFormData({...formData, order: Number(e.target.value)})} 
                  className="h-11 bg-gray-50 border-gray-100"
                />
              </div>
              <Button type="submit" className="w-full gap-2 font-black h-12 shadow-lg mt-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-bold">Syncing Categories...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {categories?.map((cat, idx) => (
                <Card key={cat.id} className="border-none shadow-sm bg-white rounded-xl overflow-hidden group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {cat.order}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 uppercase">{cat.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono">{cat.link || 'No link'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateOrder(cat.id, (cat.order || 0) - 1)}
                        title="Move Up"
                      >
                        <MoveUp size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => updateOrder(cat.id, (cat.order || 0) + 1)}
                        title="Move Down"
                      >
                        <MoveDown size={14} />
                      </Button>
                      <div className="w-px h-4 bg-gray-100 mx-1" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-red-50" 
                        onClick={() => handleDelete(cat.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!categories?.length && (
                <div className="p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic flex flex-col items-center gap-4">
                  <List size={40} className="text-gray-200" />
                  No custom categories defined. Using site defaults.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

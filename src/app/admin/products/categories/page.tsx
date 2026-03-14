
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Tags, 
  ChevronRight, 
  FolderTree,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductCategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('none');

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'product_categories'), orderBy('name', 'asc'));
  }, [db]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !name.trim()) return;
    
    try {
      await addDoc(collection(db, 'product_categories'), {
        name: name.trim(),
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        parentId: parentId === 'none' ? null : parentId,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setName('');
      setParentId('none');
      toast({ title: "Category Created", description: `${name} added to catalog.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create category." });
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'product_categories', id), { 
      status: current === 'Active' ? 'Inactive' : 'Active' 
    });
  };

  const mainCategories = categories?.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories?.filter(c => c.parentId === parentId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
          <p className="text-muted-foreground text-sm">Manage item hierarchies and sub-categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="text-primary" size={18} />
              Add New Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Category Name</label>
                <Input 
                  placeholder="e.g. Home Appliances" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Parent Category</label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="No Parent (Main Category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent (Main Category)</SelectItem>
                    {mainCategories?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full font-bold h-11 gap-2">
                <Plus size={18} /> Create Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-20 text-center">Loading categories...</div>
          ) : mainCategories?.length ? (
            <div className="grid grid-cols-1 gap-4">
              {mainCategories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <Card className="border-none shadow-sm group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Tags size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{cat.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">/{cat.slug}</span>
                            <Badge className={cn(
                              "text-[8px] font-black border-none px-1.5",
                              cat.status === 'Active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            )}>
                              {cat.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => toggleStatus(cat.id, cat.status)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDoc(doc(db!, 'product_categories', cat.id))}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Subcategories */}
                  <div className="pl-8 space-y-2">
                    {getSubcategories(cat.id)?.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 group">
                        <ChevronRight size={14} className="text-gray-300" />
                        <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-xs">
                          <span className="text-xs font-semibold">{sub.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteDoc(doc(db!, 'product_categories', sub.id))}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed rounded-2xl bg-white text-muted-foreground italic">
              No categories defined yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

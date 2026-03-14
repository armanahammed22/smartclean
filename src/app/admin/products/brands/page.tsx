
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Award, Search, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function BrandsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [name, setName] = useState('');

  const brandsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'brands'), orderBy('name', 'asc'));
  }, [db]);

  const { data: brands, isLoading } = useCollection(brandsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !name.trim()) return;
    
    try {
      await addDoc(collection(db, 'brands'), {
        name: name.trim(),
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setName('');
      toast({ title: "Brand Added", description: `${name} is now available.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add brand." });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
        <p className="text-muted-foreground text-sm">Assign brands to your equipment and supplies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add New Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Brand Name</label>
                <Input 
                  placeholder="e.g. Samsung, LG, SmartClean Pro" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full font-bold h-11 gap-2">
                <Plus size={18} /> Add Brand
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center">Loading brands...</div>
          ) : brands?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brands.map((brand) => (
                <Card key={brand.id} className="border-none shadow-sm group bg-white">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                        <Award size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{brand.name}</h4>
                        <Badge variant="outline" className="text-[8px] font-black border-none px-1.5 bg-gray-100">
                          {brand.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDoc(doc(db!, 'brands', brand.id))}>
                      <Trash2 size={16} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed rounded-2xl bg-white text-muted-foreground">
              No brands registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

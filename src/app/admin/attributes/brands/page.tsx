'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Award, 
  Plus, 
  Trash2, 
  Loader2, 
  Globe,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function BrandsManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const brandsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'brands'), orderBy('name', 'asc')) : null, [db, user]);
  const { data: brands, isLoading } = useCollection(brandsQuery);

  const handleAddBrand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'brands'), {
        name: name.trim(),
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      toast({ title: "Brand Added", description: `${name} has been added to the master list.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add brand" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this brand from the platform?")) return;
    try {
      await deleteDoc(doc(db, 'brands', id));
      toast({ title: "Brand Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const filtered = brands?.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-muted-foreground text-sm">Centralized list of authorized product manufacturers</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Registry</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Register New Brand</CardTitle>
            <CardDescription>Add a brand to the dropdown in product upload.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Brand Name</Label>
                <Input name="name" placeholder="e.g. Samsung, LG, Karcher" required className="h-11 bg-gray-50 border-gray-100" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 font-bold h-11 shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Add to Master List
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search brands..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-10 bg-white border-none shadow-sm rounded-xl"
            />
          </div>

          {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <span className="text-muted-foreground font-medium">Syncing master list...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered?.map((brand) => (
                <Card key={brand.id} className="border-none shadow-sm group hover:shadow-md transition-all bg-white rounded-xl overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/5 rounded-xl text-primary group-hover:scale-110 transition-transform">
                        <Award size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm text-gray-900 uppercase">{brand.name}</h4>
                        <Badge variant="outline" className="text-[8px] font-black border-none px-1.5 py-0 bg-green-50 text-green-700">
                          AUTHORIZED
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(brand.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {!filtered?.length && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
                  No brands found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shapes, 
  Plus, 
  Trash2, 
  Loader2, 
  Layers,
  Settings2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function VariantsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const variantsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'variant_types'), orderBy('name', 'asc')) : null, [db]);
  const { data: variants, isLoading } = useCollection(variantsQuery);

  const handleAddVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const options = (formData.get('options') as string).split(',').map(o => o.trim()).filter(o => !!o);
    
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'variant_types'), {
        name: name.trim(),
        options,
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      toast({ title: "Variant Template Created", description: `You can now use "${name}" in product uploads.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to create variant" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this variant template? Existing products won't be affected.")) return;
    try {
      await deleteDoc(doc(db, 'variant_types', id));
      toast({ title: "Template Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Variants</h1>
        <p className="text-muted-foreground text-sm">Define reusable templates for color, size, capacity, etc.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">New Variant Template</CardTitle>
            <CardDescription>Predefined options for faster data entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddVariant} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type Name</Label>
                <Input name="name" placeholder="e.g. Size, Color, Volume" required className="h-11 bg-gray-50 border-gray-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Options (Comma Separated)</Label>
                <Input name="options" placeholder="Red, Blue, Green" required className="h-11 bg-gray-50 border-gray-100" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 font-bold h-11 shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Create Template
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {variants?.map((v) => (
                <Card key={v.id} className="border-none shadow-sm group bg-white rounded-2xl overflow-hidden border-t-4 border-t-primary/10">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary"><Layers size={18} /></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(v.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <CardTitle className="text-base font-black uppercase tracking-tight text-gray-900 mt-2">{v.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {v.options?.map((opt: string) => (
                        <Badge key={opt} variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border-none bg-gray-50 text-gray-600">
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!variants?.length && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
                  No variant templates defined yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

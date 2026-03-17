
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Loader2, 
  Type,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SpecsManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'reusable_specs'), orderBy('key', 'asc')) : null, [db]);
  const { data: specs, isLoading } = useCollection(specsQuery);

  const handleAddSpecKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const key = formData.get('key') as string;
    if (!key.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reusable_specs'), {
        key: key.trim(),
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      toast({ title: "Spec Key Created", description: "This key will appear as a template in product uploads." });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add spec key" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this specification key?")) return;
    try {
      await deleteDoc(doc(db, 'reusable_specs', id));
      toast({ title: "Spec Key Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technical Spec Templates</h1>
          <p className="text-muted-foreground text-sm">Manage reusable keys for technical product data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Create Spec Key</CardTitle>
            <CardDescription>e.g. "Battery", "Voltage", "Dimensions"</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSpecKey} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Key Label Name</Label>
                <Input name="key" placeholder="e.g. Storage Capacity" required className="h-11 bg-gray-50 border-gray-100" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 font-bold h-11 shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Define Template Key
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {specs?.map((spec) => (
                <Card key={spec.id} className="border-none shadow-sm group hover:shadow-md transition-all bg-white rounded-xl overflow-hidden border border-gray-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg"><Settings2 size={16} /></div>
                      <span className="text-xs font-black uppercase tracking-tight text-gray-700 truncate max-w-[120px]">
                        {spec.key}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(spec.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {!specs?.length && !isLoading && (
                <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[2rem] bg-white text-muted-foreground italic">
                  No specification templates defined yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

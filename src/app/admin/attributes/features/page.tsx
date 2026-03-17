
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ListChecks, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FeaturesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const featuresQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'reusable_features'), orderBy('name', 'asc')) : null, [db]);
  const { data: features, isLoading } = useCollection(featuresQuery);

  const handleAddFeature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reusable_features'), {
        name: name.trim(),
        createdAt: new Date().toISOString()
      });
      e.currentTarget.reset();
      toast({ title: "Feature Template Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to add feature" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this feature template?")) return;
    try {
      await deleteDoc(doc(db, 'reusable_features', id));
      toast({ title: "Feature Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Key Feature Library</h1>
          <p className="text-muted-foreground text-sm">Manage reusable bullet points for product highlights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add Library Item</CardTitle>
            <CardDescription>Define a reusable feature text.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddFeature} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Feature Description</Label>
                <Input name="name" placeholder="e.g. 1 Year Warranty" required className="h-11 bg-gray-50 border-gray-100" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full gap-2 font-bold h-11 shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={18} />} Add to Library
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
          ) : features?.map((feature) => (
            <div key={feature.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-50 text-green-600 rounded-full"><CheckCircle2 size={14} /></div>
                <span className="text-sm font-medium text-gray-700">{feature.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(feature.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {!features?.length && !isLoading && (
            <div className="p-20 text-center border-2 border-dashed rounded-[2rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
              <Sparkles size={40} className="text-gray-200" />
              Your feature library is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

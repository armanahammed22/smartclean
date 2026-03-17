
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Grid, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HomepageSectionsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const sectionsQuery = useMemoFirebase(() => db ? query(collection(db, 'homepage_sections'), orderBy('order', 'asc')) : null, [db]);
  const { data: sections, isLoading } = useCollection(sectionsQuery);

  const handleToggle = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'homepage_sections', id), { isActive: !current });
    toast({ title: "Layout Updated" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage Layout Blocks</h1>
        <p className="text-muted-foreground text-sm">Control visibility and sequence of main content sections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-full p-20 text-center"><Loader2 className="animate-spin inline" /></div> : sections?.map((section) => (
          <Card key={section.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Grid size={18} /></div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">{section.title}</CardTitle>
              </div>
              <Switch checked={section.isActive} onCheckedChange={() => handleToggle(section.id, section.isActive)} />
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  <span>Section Type</span>
                  <span className="text-primary">{section.type || 'Dynamic'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                  <span>Display Sequence</span>
                  <span>Pos: {section.order}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
        <CardContent className="p-10 flex items-start gap-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><Info size={32} /></div>
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-blue-900">Module Hints</h3>
            <p className="text-sm text-blue-800/70 leading-relaxed font-medium">
              Turning off a section here completely hides it from the homepage. 
              This is useful for seasonal content like "Current Offers" or "New Product Reveals".
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

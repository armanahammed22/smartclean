
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Trash2, Edit, Globe, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ServiceAreasPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [newArea, setNewArea] = useState('');

  const areasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'service_areas'), orderBy('name', 'asc'));
  }, [db]);

  const { data: areas, isLoading } = useCollection(areasQuery);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newArea.trim()) return;
    try {
      await addDoc(collection(db, 'service_areas'), {
        name: newArea.trim(),
        status: 'Active',
        createdAt: new Date().toISOString()
      });
      setNewArea('');
      toast({ title: "Area Added", description: `${newArea} is now a supported service region.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add area." });
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const newStatus = current === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'service_areas', id), { status: newStatus });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
          <p className="text-muted-foreground text-sm">Define regions where your services are available</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
           <Globe size={16} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Ops: Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add New Region</CardTitle>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleAddArea} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Region Name</label>
                   <Input 
                     placeholder="e.g. Uttara, Dhaka" 
                     value={newArea}
                     onChange={(e) => setNewArea(e.target.value)}
                     className="h-11 bg-gray-50 border-gray-100 focus:bg-white"
                   />
                </div>
                <Button type="submit" className="w-full gap-2 font-bold h-11 shadow-lg">
                   <Plus size={18} /> Add Service Area
                </Button>
             </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
           {isLoading ? (
             <div className="p-20 text-center flex flex-col items-center gap-3">
               <Loader2 className="animate-spin text-primary" size={32} />
               <span className="text-muted-foreground font-medium">Syncing areas...</span>
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-4 md:gap-6">
               {areas?.map((area) => (
                 <Card key={area.id} className="border-none shadow-sm group hover:shadow-md transition-all bg-white rounded-2xl">
                    <CardContent className="p-5 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                             <MapPin size={20} />
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-bold text-gray-900 text-sm leading-tight">{area.name}</h4>
                             <Badge variant="outline" className={cn(
                               "text-[8px] font-black border-none px-1.5 py-0",
                               area.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                             )}>
                               {area.status?.toUpperCase()}
                             </Badge>
                          </div>
                       </div>
                       <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg"
                            onClick={() => toggleStatus(area.id, area.status)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg"
                            onClick={() => deleteDoc(doc(db!, 'service_areas', area.id))}
                          >
                            <Trash2 size={14} />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ))}
               {!areas?.length && !isLoading && (
                 <div className="col-span-full p-20 text-center border-2 border-dashed rounded-3xl bg-white text-muted-foreground italic">
                    All services are globally available.
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

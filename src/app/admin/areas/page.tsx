
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Trash2, Edit, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Service Area Management</h1>
          <p className="text-muted-foreground text-sm">Define regions where your services are available</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
           <Globe size={16} className="text-primary" />
           <span className="text-xs font-bold uppercase tracking-widest">Global Ops: Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Add New Region</CardTitle>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleAddArea} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold uppercase text-muted-foreground">Region Name</label>
                   <Input 
                     placeholder="e.g. Uttara, Dhaka" 
                     value={newArea}
                     onChange={(e) => setNewArea(e.target.value)}
                     className="h-11"
                   />
                </div>
                <Button type="submit" className="w-full gap-2 font-bold h-11">
                   <Plus size={18} /> Add Service Area
                </Button>
             </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
           {isLoading ? (
             <div className="p-20 text-center text-muted-foreground">Loading areas...</div>
           ) : areas?.length ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {areas.map((area) => (
                 <Card key={area.id} className="border-none shadow-sm group hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                             <MapPin size={20} />
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900">{area.name}</h4>
                             <Badge variant="outline" className={cn(
                               "text-[8px] font-black border-none px-1.5",
                               area.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                             )}>
                               {area.status?.toUpperCase()}
                             </Badge>
                          </div>
                       </div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary"
                            onClick={() => toggleStatus(area.id, area.status)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteDoc(doc(db!, 'service_areas', area.id))}
                          >
                            <Trash2 size={14} />
                          </Button>
                       </div>
                    </CardContent>
                 </Card>
               ))}
             </div>
           ) : (
             <div className="p-20 text-center border-2 border-dashed rounded-2xl bg-white text-muted-foreground italic">
                No service areas defined. Services will be globally available by default.
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

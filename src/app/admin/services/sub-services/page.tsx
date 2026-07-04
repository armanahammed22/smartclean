
"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Loader2, Zap, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function SubServicesManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Data Queries
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services'), orderBy('name', 'asc')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db]);

  const { data: subServices, isLoading } = useCollection(subServicesQuery);
  const { data: services } = useCollection(servicesQuery);

  const filteredSubs = useMemo(() => {
    if (!subServices) return [];
    return subServices.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subServices, searchTerm]);

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'sub_services', id), { status: next });
    toast({ title: `Sub-service ${next === 'Active' ? 'Enabled' : 'Disabled'}` });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this sub-service permanently?")) return;
    try {
      await deleteDoc(doc(db, 'sub_services', id));
      toast({ title: "Removed Successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-12 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Sub-Services Desk</h1>
          <p className="text-muted-foreground text-sm font-medium">Configure task-based services and add-on pricing</p>
        </div>
        <Button 
          className="gap-2 font-black h-11 px-6 rounded-xl shadow-lg bg-primary hover:bg-primary/90 transition-all active:scale-95" 
          onClick={() => router.push('/admin/services/sub-services/new')}
        >
          <Plus size={18} /> Add New Sub-Service
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Subs", val: subServices?.length || 0, icon: Layers, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Active", val: subServices?.filter(s => s.status === 'Active').length || 0, icon: Zap, bg: "bg-green-50", color: "text-green-600" },
          { label: "Parent Links", val: services?.length || 0, icon: Zap, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Global Status", val: "Operational", icon: Zap, bg: "bg-primary/5", color: "text-primary" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-lg font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <div className="p-6 md:p-8 border-b bg-gray-50/30">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search by sub-service name..." 
              className="pl-12 h-12 bg-white border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-none">
                  <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest">Sub-Service</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Parent Link</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Pricing Model</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Price</TableHead>
                  <TableHead className="font-black text-center uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filteredSubs.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {sub.imageUrl && <Image src={sub.imageUrl} alt={sub.name} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{sub.name}</div>
                          <div className="text-[9px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">ID: {sub.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-none">
                        {services?.find(s => s.id === sub.mainServiceId)?.title || 'Unlinked'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{sub.pricingType === 'sqft' ? 'Per Square Feet' : 'Per Quantity'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-gray-900">৳{sub.price?.toLocaleString()}</span>
                        {sub.regularPrice > sub.price && <span className="text-[10px] text-gray-400 line-through">৳{sub.regularPrice}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", sub.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all" onClick={() => router.push(`/admin/services/sub-services/${sub.id}`)} title="Edit">
                          <Edit size={14} />
                        </Button>
                        <button 
                          onClick={() => toggleStatus(sub.id, sub.status)}
                          className={cn("p-1.5 rounded-lg transition-all", sub.status === 'Active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}
                          title={sub.status === 'Active' ? "Disable" : "Enable"}
                        >
                          <Zap size={14} fill={sub.status === 'Active' ? "currentColor" : "none"} />
                        </button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-red-50 hover:bg-red-100 rounded-xl transition-all" onClick={() => handleDelete(sub.id)} title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit, 
  Layers, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search,
  ArrowRight,
  Loader2,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';

export default function ServicesManagementPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => db ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db]);
  
  const { data: services, isLoading } = useCollection(servicesQuery);
  const { data: categories } = useCollection(categoriesQuery);

  const stats = useMemo(() => {
    if (!services) return { total: 0, active: 0, inactive: 0 };
    return {
      total: services.length,
      active: services.filter(s => s.status === 'Active').length,
      inactive: services.filter(s => s.status === 'Inactive').length
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => 
      s.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredServices?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices?.map(s => s.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} services?`)) return;
    setIsBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, 'services', id)));
      await batch.commit();
      setSelectedIds([]);
      toast({ title: "Bulk Delete Completed" });
    } catch (e) {} finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'services', id), { status: next });
    toast({ title: `Service ${next === 'Active' ? 'Enabled' : 'Disabled'}` });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Service Registry</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage professional service definitions and operational logic</p>
        </div>
        <Button className="w-full md:w-auto gap-2 font-black shadow-lg h-11 px-8 rounded-xl bg-primary hover:bg-primary/90" onClick={() => router.push('/admin/services/new')}>
          <Plus size={18} /> {t('new_service')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active Services", val: stats.total, icon: Wrench, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Live", val: stats.active, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Draft/Hold", val: stats.inactive, icon: XCircle, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Total Bookings", val: "---", icon: Clock, bg: "bg-indigo-50", color: "text-indigo-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <div className="p-6 md:p-8 border-b bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search by service label..." 
              className="pl-12 h-12 bg-white border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <Button variant="destructive" className="rounded-xl h-12 px-6 font-black uppercase text-xs" onClick={handleBulkDelete} disabled={isBulkProcessing}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={filteredServices?.length ? selectedIds.length === filteredServices.length : false}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-bold py-5 pl-4 uppercase text-[10px] tracking-widest">Service Details</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Taxonomy</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Base Rate</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filteredServices?.map((service) => (
                  <TableRow key={service.id} className={cn("hover:bg-gray-50/50 transition-colors group", selectedIds.includes(service.id) && "bg-primary/5")}>
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.includes(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                      />
                    </TableCell>
                    <TableCell className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{service.title}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase tracking-tighter">ID: {service.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase bg-primary/5 text-primary border-none">{categories?.find(c => c.id === service.categoryId)?.name || 'General'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-primary text-sm">৳{service.basePrice?.toLocaleString()}</span>
                        <span className="text-[8px] font-black uppercase text-gray-400">{service.pricingType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", service.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100" asChild title="Edit">
                          <Link href={`/admin/services/${service.id}`}><Edit size={14} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary bg-primary/5 hover:bg-primary/10" asChild title="View">
                          <Link href={`/service/${service.slug || service.id}`} target="_blank"><Eye size={14} /></Link>
                        </Button>
                        <button 
                          onClick={() => toggleStatus(service.id, service.status)}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            service.status === 'Active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                          )}
                          title={service.status === 'Active' ? "Disable" : "Enable"}
                        >
                          <Zap size={14} fill={service.status === 'Active' ? "currentColor" : "none"} />
                        </button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-red-50 hover:bg-red-100" onClick={() => deleteDoc(doc(db!, 'services', service.id))} title="Delete">
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

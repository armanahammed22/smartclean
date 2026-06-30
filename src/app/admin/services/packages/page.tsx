
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit, 
  Zap, 
  Eye, 
  Loader2, 
  Search, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export default function ServicePackagesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const packagesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'service_packages'), orderBy('name', 'asc')) : null, [db]);
  const { data: packages, isLoading } = useCollection(packagesQuery);

  const filtered = packages?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (id: string, current: string) => {
    if (!db) return;
    const next = current === 'Active' ? 'Inactive' : 'Active';
    await updateDoc(doc(db, 'service_packages', id), { status: next });
    toast({ title: `Package ${next === 'Active' ? 'Enabled' : 'Disabled'}` });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Purge this bundle permanently?")) return;
    await deleteDoc(doc(db, 'service_packages', id));
    toast({ title: "Package Removed" });
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Service Packages</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage multi-service bundles and fixed-price contracts</p>
        </div>
        <Button asChild className="rounded-xl font-black h-11 px-8 shadow-xl shadow-primary/20 gap-2 uppercase text-xs tracking-widest">
          <Link href="/admin/services/packages/new"><Plus size={18} /> Design New Bundle</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Bundles", val: packages?.filter(p => p.status === 'Active').length || 0, icon: Layers, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Total Managed", val: packages?.length || 0, icon: Briefcase, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Package Drafts", val: packages?.filter(p => p.status === 'Inactive').length || 0, icon: Zap, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Global Sync", val: "ACTIVE", icon: ShieldCheck, bg: "bg-emerald-50", color: "text-emerald-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{s.val}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", s.bg, s.color)}><s.icon size={18} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
        <Input 
          placeholder="Filter by package name or ID..." 
          className="h-12 pl-12 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-full">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-none">
                  <TableHead className="py-5 pl-8 font-black uppercase text-[10px] tracking-widest">Bundle Identity</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Included Content</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Bundle Price</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
                ) : filtered?.map((pkg) => (
                  <TableRow key={pkg.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border">
                          {pkg.imageUrl ? <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" unoptimized /> : <Layers size={24} className="m-auto text-gray-200" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] leading-tight">{pkg.name}</div>
                          <div className="text-[9px] text-muted-foreground font-mono mt-1">ID: {pkg.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {pkg.includedServiceNames?.slice(0, 3).map((s: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[7px] font-black uppercase px-1.5 border-gray-100 bg-gray-50">{s}</Badge>
                        ))}
                        {pkg.includedServiceNames?.length > 3 && <span className="text-[8px] font-bold text-gray-300">+{pkg.includedServiceNames.length - 3} More</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-sm text-gray-900">
                      ৳{pkg.price?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", pkg.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                        {pkg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50" asChild title="Edit">
                          <Link href={`/admin/services/packages/${pkg.id}`}><Edit size={14}/></Link>
                        </Button>
                        <button 
                          onClick={() => toggleStatus(pkg.id, pkg.status)}
                          className={cn("p-1.5 rounded-lg transition-all", pkg.status === 'Active' ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400")}
                          title={pkg.status === 'Active' ? "Disable" : "Enable"}
                        >
                          <Zap size={14} fill={pkg.status === 'Active' ? "currentColor" : "none"} />
                        </button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive bg-red-50 hover:bg-red-100" onClick={() => handleDelete(pkg.id)} title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered?.length && !isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground"><Sparkles size={48} className="mx-auto mb-4 opacity-10" />No packages defined yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

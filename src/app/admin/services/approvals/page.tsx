
'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  Wrench, 
  Store,
  AlertCircle,
  Star,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ServiceApprovalsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // 🛡️ SECURITY FIX: Fetch all and filter in memory to avoid "Missing Index" errors.
  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allServices, isLoading } = useCollection(servicesQuery);

  const pendingServices = useMemo(() => {
    return allServices?.filter(s => s.status === 'Pending') || [];
  }, [allServices]);

  const handleApprove = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'services', id), { 
        status: 'Active',
        approvedAt: new Date().toISOString()
      });
      toast({ title: "Service Approved", description: "Successfully published to the catalog." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleReject = async (id: string) => {
    if (!db || !confirm("Reject this service?")) return;
    try {
      await updateDoc(doc(db, 'services', id), { 
        status: 'Rejected'
      });
      toast({ title: "Service Rejected" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Service Approvals</h1>
          <p className="text-muted-foreground text-sm font-medium">Review vendor-submitted professional services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-orange-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Pending Services</p>
              <h3 className="text-3xl font-black">{pendingServices.length}</h3>
            </div>
            <AlertCircle size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-indigo-50 text-indigo-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-indigo-700/80 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Queue Health</p>
              <h3 className="text-3xl font-black">Active</h3>
            </div>
            <Wrench size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-[#081621] text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Moderator Mode</p>
              <h3 className="text-3xl font-black">ON</h3>
            </div>
            <TrendingUp size={40} className="opacity-20 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Service Preview</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Provider Info</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Category</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Price Start</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : pendingServices.length > 0 ? (
                pendingServices.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border bg-gray-50 shrink-0">
                          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill className="object-cover" unoptimized />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-gray-900 uppercase text-xs truncate max-w-[200px] block leading-none mb-1">{service.title}</span>
                          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest">ID: {service.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Store size={12} /></div>
                        <span className="text-xs font-bold text-gray-700 uppercase">{service.vendorName || 'Independent Pro'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px]">{service.categoryId}</Badge>
                    </TableCell>
                    <TableCell className="font-black text-sm text-gray-900">
                      ৳{service.basePrice?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-green-600 hover:bg-green-50" onClick={() => handleApprove(service.id)}>
                          <CheckCircle2 size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => handleReject(service.id)}>
                          <XCircle size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/5">
                          <Eye size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">
                    No services awaiting approval.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

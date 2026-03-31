
'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  User,
  Clock,
  Search,
  Filter,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function VendorVerificationQueuePage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Fixed Index Error: Fetch all and filter in memory for prototypes
  const vendorsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'vendor_profiles'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: allVendors, isLoading } = useCollection(vendorsQuery);

  const pendingQueue = useMemo(() => {
    return allVendors?.filter(v => v.status === 'Pending' || !v.isVerified) || [];
  }, [allVendors]);

  const filtered = useMemo(() => {
    return pendingQueue.filter(v => 
      v.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingQueue, searchTerm]);

  const handleApprove = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'vendor_profiles', id), { 
        status: 'Approved',
        isVerified: true,
        isIdVerified: true,
        verifiedAt: new Date().toISOString()
      });
      toast({ title: "Vendor Verified", description: "Account is now fully active." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border h-10 w-10">
            <Link href="/admin/vendors"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">Verification Queue</h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Pending KYC & Business Credential Review</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-orange-50 text-orange-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Awaiting Review</p>
              <h3 className="text-3xl font-black">{pendingQueue.length}</h3>
            </div>
            <AlertTriangle size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700 rounded-3xl overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Average Review</p>
              <h3 className="text-3xl font-black">2.4h</h3>
            </div>
            <Clock size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><ShieldCheck size={100} /></div>
          <CardContent className="p-6 flex items-center justify-between h-full relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Security Mode</p>
              <h3 className="text-3xl font-black italic">ROOT</h3>
            </div>
            <ShieldCheck size={40} className="text-white opacity-40" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by owner name or shop..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="pl-8 py-5 font-bold uppercase text-[9px] tracking-widest">Vendor / Owner</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Docs Provided</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest">Apply Date</TableHead>
                <TableHead className="font-bold uppercase text-[9px] tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[9px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all uppercase">{vendor.shopName?.[0]}</div>
                      <div>
                        <p className="font-black text-gray-900 uppercase text-xs leading-none mb-1">{vendor.shopName}</p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">{vendor.ownerName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={cn("text-[7px] border-none font-black px-1.5", vendor.tradeLicenseUrl ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400")}>LICENSE</Badge>
                      <Badge variant="outline" className={cn("text-[7px] border-none font-black px-1.5", vendor.nidUrl ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-400")}>NID</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-400">
                    {vendor.createdAt ? format(new Date(vendor.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-[8px] font-black uppercase border-none px-2 py-0.5">REVIEW PENDING</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-xl" onClick={() => handleApprove(vendor.id)}>
                        <CheckCircle2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-xl" asChild>
                        <Link href={`/admin/vendors/${vendor.id}?tab=verification`}><Eye size={16} /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50 rounded-xl">
                        <XCircle size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-24 italic text-muted-foreground font-medium">Verification queue is currently empty.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

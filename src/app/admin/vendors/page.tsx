'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Store, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Eye,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VendorManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const vendorsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'vendor_profiles'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: vendors, isLoading } = useCollection(vendorsQuery);

  const handleUpdateStatus = async (vendorId: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'vendor_profiles', vendorId), { status });
      toast({ title: `Vendor ${status}`, description: "Status updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const filtered = vendors?.filter(v => 
    v.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Vendor Management</h1>
          <p className="text-muted-foreground text-sm font-medium">Approve and oversee independent shop owners</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Vendors", val: vendors?.length || 0, icon: Store, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Pending Approvals", val: vendors?.filter(v => v.status === 'Pending').length || 0, icon: AlertTriangle, bg: "bg-orange-50", color: "text-orange-600" },
          { label: "Active Shops", val: vendors?.filter(v => v.status === 'Approved').length || 0, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" },
          { label: "Blocked", val: vendors?.filter(v => v.status === 'Blocked').length || 0, icon: XCircle, bg: "bg-red-50", color: "text-red-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl shrink-0", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Shop Name or Owner..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2 w-full sm:w-auto"><Filter size={18} /> Filter</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Vendor / Shop</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Joined</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : filtered?.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black shadow-inner">
                        {vendor.shopName?.[0]}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-xs uppercase leading-none mb-1">{vendor.shopName}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{vendor.ownerName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700"><Mail size={10} /> {vendor.email}</div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700"><Phone size={10} /> {vendor.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-400">
                    {vendor.createdAt ? format(new Date(vendor.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2 py-0.5 rounded-md",
                      vendor.status === 'Pending' ? "bg-orange-50 text-orange-600" :
                      vendor.status === 'Approved' ? "bg-green-50 text-green-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      {vendor.status || 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {vendor.status !== 'Approved' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleUpdateStatus(vendor.id, 'Approved')}>
                          <CheckCircle2 size={16} />
                        </Button>
                      )}
                      {vendor.status !== 'Blocked' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleUpdateStatus(vendor.id, 'Blocked')}>
                          <XCircle size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedVendor(vendor)}>
                        <Eye size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#081621] text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-primary" /> Vendor Profile Security
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2 tracking-widest">Business Details</h4>
                <div className="space-y-2">
                  <p className="text-sm font-black text-gray-900 uppercase">{selectedVendor?.shopName}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedVendor?.businessAddress || 'No address provided'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground border-b pb-2 tracking-widest">Verification Status</h4>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                  {selectedVendor?.status === 'Approved' ? (
                    <div className="flex items-center gap-2 text-green-600 text-[10px] font-black">
                      <CheckCircle2 size={16} /> ACCOUNT VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black">
                      <AlertTriangle size={16} /> KYC PENDING
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

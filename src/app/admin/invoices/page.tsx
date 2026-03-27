
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Download, Trash2, Eye, Loader2, Filter, ReceiptText, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InvoicesListPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const invoicesQuery = useMemoFirebase(() => db ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this invoice record?")) return;
    await deleteDoc(doc(db, 'invoices', id));
  };

  const filtered = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Billing Registry</h1>
          <p className="text-muted-foreground text-sm">Monitor all service and product invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11"><Download size={18} /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50 text-blue-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Invoices</p>
              <h3 className="text-3xl font-black">{invoices?.length || 0}</h3>
            </div>
            <ReceiptText size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50 text-green-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue Collected</p>
              <h3 className="text-3xl font-black">৳{invoices?.filter(i => i.paymentStatus === 'Paid').reduce((acc, i) => acc + (i.total || 0), 0).toLocaleString()}</h3>
            </div>
            <Wallet size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 text-red-700">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Outstanding Dues</p>
              <h3 className="text-3xl font-black">৳{invoices?.filter(i => i.paymentStatus !== 'Paid').reduce((acc, i) => acc + (i.total || 0), 0).toLocaleString()}</h3>
            </div>
            <AlertCircle size={40} className="opacity-20" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search Invoice # or Customer..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 gap-2 rounded-xl font-bold border-gray-200"><Filter size={18} /> Filters</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl md:rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Client</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Payment</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Date</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8 font-black text-xs text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="text-xs font-bold text-gray-900">{inv.customerInfo?.name}</div>
                    <div className="text-[9px] text-muted-foreground font-medium">{inv.customerInfo?.phone}</div>
                  </TableCell>
                  <TableCell className="font-black text-sm text-gray-900">৳{inv.total?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase border-none px-2 py-0.5 rounded-md",
                      inv.paymentStatus === 'Paid' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {inv.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-gray-400">
                    {inv.createdAt ? format(new Date(inv.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-xl" asChild>
                        <Link href={`/admin/invoices/${inv.id}`}><Eye size={16} /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50 rounded-xl" onClick={() => handleDelete(inv.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered?.length && !isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">No invoices found in the system.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

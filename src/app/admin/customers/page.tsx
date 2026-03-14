
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Filter, MoreVertical, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';

export default function CustomersPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const customersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'customers'), orderBy('name', 'asc'));
  }, [db]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const filtered = customers?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Directory</h1>
          <p className="text-muted-foreground text-sm">Manage CRM profiles and order history</p>
        </div>
        <Button className="gap-2 font-bold"><UserPlus size={18} /> New Customer</Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by name, phone or email..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2"><Filter size={18} /> Segmentation</Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Customer</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Location</TableHead>
                <TableHead className="font-bold">Total Spent</TableHead>
                <TableHead className="font-bold">Segment</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">Loading directory...</TableCell></TableRow>
              ) : filtered?.length ? (
                filtered.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`https://picsum.photos/seed/${customer.id}/100`} />
                          <AvatarFallback>{customer.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-sm">{customer.name}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">ID: {customer.id.slice(0,8)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs"><Phone size={10} className="text-primary" /> {customer.phone}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={10} /> {customer.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 text-xs truncate max-w-[150px]">
                         <MapPin size={10} className="text-gray-400" /> {customer.address || 'Dhaka'}
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-black text-sm text-primary">৳{customer.totalSpent?.toLocaleString() || '0'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">
                        {customer.segment || 'Regular'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground">No customers found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

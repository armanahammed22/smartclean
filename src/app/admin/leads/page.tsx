'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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
import { Search, Plus, Filter, MoreVertical, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function LeadsPage() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const filteredLeads = leads?.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Leads</h1>
          <p className="text-muted-foreground text-sm">Manage potential customers and follow-ups</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg">
          <Plus size={18} /> Add New Lead
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search leads by name or phone..." 
            className="pl-10 h-11 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 gap-2">
          <Filter size={18} /> Filter
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Customer Name</TableHead>
                <TableHead className="font-bold">Contact Info</TableHead>
                <TableHead className="font-bold">Source</TableHead>
                <TableHead className="font-bold">Created Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Loading leads...</TableCell>
                </TableRow>
              ) : filteredLeads?.length ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-gray-900">{lead.name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} /> {lead.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} className="text-primary" /> {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail size={12} /> {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-[10px] font-black uppercase">
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.createdAt ? format(new Date(lead.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-black uppercase",
                        lead.status === 'New' && "bg-blue-500",
                        lead.status === 'Qualified' && "bg-green-500",
                        lead.status === 'Contacted' && "bg-orange-500",
                        lead.status === 'Lost' && "bg-gray-400"
                      )}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                    No leads found matching your criteria.
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

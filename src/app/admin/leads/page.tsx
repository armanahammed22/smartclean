
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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
import { Search, Plus, Filter, MoreVertical, Phone, Mail, MapPin, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LeadsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const filteredLeads = leads?.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const leadData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
      source: formData.get('source') as string,
      status: 'New',
      createdAt: new Date().toISOString()
    };

    try {
      addDoc(collection(db, 'leads'), leadData).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'leads', operation: 'create', requestResourceData: leadData }));
      });
      toast({ title: "Lead Created" });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error creating lead" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLeadStatus = (id: string, newStatus: string) => {
    if (!db) return;
    updateDoc(doc(db, 'leads', id), { status: newStatus }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `leads/${id}`, operation: 'update', requestResourceData: { status: newStatus } }));
    });
    toast({ title: `Status Updated to ${newStatus}` });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Leads</h1>
          <p className="text-muted-foreground text-sm">Manage potential customers and follow-ups</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg" onClick={() => setIsDialogOpen(true)}>
              <Plus size={18} /> Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddLead} className="space-y-4">
              <DialogHeader><DialogTitle>Register New Lead</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" required placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" required placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Service Area / Address</Label>
                <Input name="address" placeholder="Uttara, Dhaka" />
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select name="source" defaultValue="WhatsApp">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Call">Direct Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Create Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                      <Select defaultValue={lead.status} onValueChange={(val) => updateLeadStatus(lead.id, val)}>
                        <SelectTrigger className={cn(
                          "h-8 text-[10px] font-black uppercase w-[120px]",
                          lead.status === 'New' && "bg-blue-50 text-blue-600 border-blue-200",
                          lead.status === 'Qualified' && "bg-green-50 text-green-600 border-green-200",
                          lead.status === 'Contacted' && "bg-orange-50 text-orange-600 border-orange-200",
                          lead.status === 'Lost' && "bg-gray-50 text-gray-600 border-gray-200"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Qualified">Qualified</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db!, 'leads', lead.id))}>
                        <Trash2 size={16} className="text-destructive" />
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

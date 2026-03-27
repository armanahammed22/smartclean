
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
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
  Zap, 
  Trash2, 
  Loader2, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Users,
  Wallet,
  Calendar,
  Clock,
  ClipboardList,
  Edit,
  ArrowRight
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingAssignDialog } from '@/components/admin/BookingAssignDialog';

export default function AdminCustomRequestsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [assignTarget, setAssignTarget] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestsQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'custom_requests'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: requests, isLoading } = useCollection(requestsQuery);

  const stats = useMemo(() => {
    if (!requests) return { total: 0, pending: 0, quoted: 0, approved: 0 };
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      quoted: requests.filter(r => r.status === 'Quoted').length,
      approved: requests.filter(r => r.status === 'Approved' || r.status === 'Assigned').length
    };
  }, [requests]);

  const filtered = requests?.filter(r => 
    r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.services?.join(',').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateStatus = async (id: string, status: string, data: any = {}) => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'custom_requests', id), { 
        status, 
        ...data,
        updatedAt: new Date().toISOString()
      });
      toast({ title: `Request ${status}` });
      setSelectedRequest(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this request permanently?")) return;
    await deleteDoc(doc(db, 'custom_requests', id));
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase">Custom Service Desk</h1>
          <p className="text-muted-foreground text-sm">Manage non-standard service requests and pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Volume", val: stats.total, icon: ClipboardList, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Needs Pricing", val: stats.pending, icon: Zap, bg: "bg-amber-50", color: "text-amber-600" },
          { label: "Sent Quotes", val: stats.quoted, icon: Wallet, bg: "bg-indigo-50", color: "text-indigo-600" },
          { label: "Approved Plans", val: stats.approved, icon: CheckCircle2, bg: "bg-green-50", color: "text-green-600" }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{s.label}</p>
                <h3 className="text-xl font-black text-gray-900">{s.val}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", s.bg, s.color)}><s.icon size={20} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search by customer or service type..." 
            className="pl-12 h-12 border-none bg-gray-50 focus:bg-white rounded-xl transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Client Identity</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Requested Items</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Schedule</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin text-primary inline" /></TableCell></TableRow>
              ) : filtered?.map((req) => (
                <TableRow key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="py-5 pl-8">
                    <div className="font-black text-gray-900 text-xs uppercase">{req.customerName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1">ID: {req.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {req.services?.map((s: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-white text-[8px] font-black uppercase border-gray-200">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600"><Calendar size={12} className="text-primary"/> {req.requestedDate}</div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><Clock size={12}/> {req.requestedTime}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[8px] font-black uppercase border-none px-2",
                      req.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      req.status === 'Quoted' ? "bg-blue-50 text-blue-700" :
                      req.status === 'Approved' ? "bg-green-50 text-green-700" :
                      "bg-gray-100 text-gray-500"
                    )}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setSelectedRequest(req)}><Edit size={16} /></Button>
                      {req.status === 'Approved' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => setAssignTarget(req)}><Users size={16} /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(req.id)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DETAIL & QUOTATION DIALOG */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="flex flex-col max-h-[85vh]">
            <header className="p-8 bg-[#081621] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl"><Zap size={24} /></div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Request Details & Pricing</DialogTitle>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2 block">Client & Intent</Label>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase">{selectedRequest?.customerName}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">CONTACT INFO PENDING VERIFICATION</p>
                  </div>
                  <div className="space-y-2">
                    {selectedRequest?.services?.map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <CheckCircle2 size={14} className="text-primary" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2 block">Schedule Requirement</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-xs"><Calendar size={14}/> {selectedRequest?.requestedDate}</div>
                      <div className="flex items-center gap-2 text-blue-700 font-bold text-xs"><Clock size={14}/> {selectedRequest?.requestedTime}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-gray-400">Participants</span>
                      <span className="text-xs font-black text-gray-900">{selectedRequest?.staffCount} Personnel</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description of Work</Label>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-sm text-gray-600 leading-relaxed font-medium">
                  "{selectedRequest?.details}"
                </div>
              </div>

              <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 space-y-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                  <Wallet size={18} /> Official Quotation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-700">Total Project Price (৳)</Label>
                    <Input 
                      type="number" 
                      defaultValue={selectedRequest?.price || ''} 
                      placeholder="0.00"
                      onChange={(e) => selectedRequest.price = parseFloat(e.target.value)}
                      className="h-12 bg-white border-none rounded-xl font-black text-lg shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-700">Admin Note / Terms</Label>
                    <Input 
                      defaultValue={selectedRequest?.adminNote || ''}
                      placeholder="e.g. Includes materials"
                      onChange={(e) => selectedRequest.adminNote = e.target.value}
                      className="h-12 bg-white border-none rounded-xl font-medium text-xs shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="rounded-xl h-12 flex-1 font-bold">Close</Button>
              <Button 
                onClick={() => handleUpdateStatus(selectedRequest.id, 'Quoted', { price: selectedRequest.price, adminNote: selectedRequest.adminNote })}
                disabled={isSubmitting || !selectedRequest?.price}
                className="rounded-xl h-12 flex-1 font-black bg-blue-600 hover:bg-blue-700 uppercase tracking-tighter shadow-xl"
              >
                Send Quotation
              </Button>
              <Button 
                onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved', { price: selectedRequest.price })}
                disabled={isSubmitting || !selectedRequest?.price}
                className="rounded-xl h-12 flex-1 font-black bg-green-600 hover:bg-green-700 uppercase tracking-tighter shadow-xl"
              >
                Direct Approve
              </Button>
            </footer>
          </div>
        </DialogContent>
      </Dialog>

      {/* STAFF ASSIGNMENT DIALOG */}
      <BookingAssignDialog 
        booking={assignTarget ? { ...assignTarget, id: assignTarget.id, serviceTitle: assignTarget.services?.join(', ') } : null} 
        isOpen={!!assignTarget} 
        onClose={() => setAssignTarget(null)} 
      />
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  HelpCircle, 
  MessageSquare, 
  User, 
  Clock, 
  Send, 
  CheckCircle2, 
  MoreVertical,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

export default function AdminSupportTicketsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const ticketsQuery = useMemoFirebase(() => db ? query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const handleReply = async () => {
    if (!db || !selectedTicket || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        adminReply: replyText,
        status: 'Replied',
        repliedAt: new Date().toISOString()
      });
      toast({ title: "Reply Sent", description: "The customer has been notified." });
      setSelectedTicket(null);
      setReplyText('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send reply." });
    } finally {
      setIsReplying(false);
    }
  };

  const closeTicket = async (id: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'support_tickets', id), { status: 'Closed' });
    toast({ title: "Ticket Closed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
          <p className="text-muted-foreground text-sm">Respond to customer inquiries and issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Open Tickets</p>
              <h3 className="text-3xl font-black mt-1">{tickets?.filter(t => t.status === 'Open').length || 0}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><HelpCircle size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase">Avg. Response Time</p>
              <h3 className="text-3xl font-black mt-1">2.4h</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock size={24} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase">Resolved Total</p>
              <h3 className="text-3xl font-black mt-1">{tickets?.filter(t => t.status === 'Closed').length || 0}</h3>
            </div>
            <CheckCircle2 size={40} className="opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Customer</TableHead>
                <TableHead className="font-bold">Subject</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20">Loading tickets...</TableCell></TableRow>
              ) : tickets?.length ? (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                    <TableCell className="py-4">
                      <div className="font-bold text-sm">{ticket.customerName || 'Guest User'}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} /> {ticket.customerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium max-w-[250px] truncate">{ticket.subject}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{format(new Date(ticket.createdAt), 'MMM dd, hh:mm a')}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black border-none uppercase",
                        ticket.status === 'Open' ? "bg-red-100 text-red-700" : 
                        ticket.status === 'Replied' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      )}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); closeTicket(ticket.id); }}>
                        <CheckCircle2 size={16} className="text-muted-foreground hover:text-green-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No support tickets found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Details / Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="text-primary" />
              Ticket: {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Customer Message</span>
                <span className="text-[10px] text-muted-foreground">{selectedTicket?.createdAt && format(new Date(selectedTicket.createdAt), 'PPpp')}</span>
              </div>
              <p className="text-sm leading-relaxed">{selectedTicket?.message}</p>
            </div>

            {selectedTicket?.adminReply && (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Previous Admin Reply</span>
                <p className="text-sm leading-relaxed italic">{selectedTicket.adminReply}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Send Reply</label>
              <Textarea 
                placeholder="Type your response to the customer..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[150px] bg-gray-50 border-none focus:bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Cancel</Button>
            <Button onClick={handleReply} disabled={isReplying || !replyText.trim()} className="gap-2 font-bold">
              {isReplying ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

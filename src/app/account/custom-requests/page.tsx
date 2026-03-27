
'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Loader2, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  Info,
  History,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CustomerCustomRequestsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<string[]>(['']);
  
  const [formData, setFormData] = useState({
    details: '',
    requestedDate: '',
    requestedTime: '08:00',
    staffCount: 1,
    isQuotationRequested: true
  });

  const requestsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'custom_requests'), where('customerId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: requests, isLoading } = useCollection(requestsQuery);

  const addServiceField = () => setServices([...services, '']);
  const removeServiceField = (index: number) => setServices(services.filter((_, i) => i !== index));
  const updateServiceValue = (index: number, val: string) => {
    const next = [...services];
    next[index] = val;
    setServices(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    const filteredServices = services.filter(s => !!s.trim());
    if (filteredServices.length === 0) {
      toast({ variant: "destructive", title: "Missing Data", description: "Please add at least one service type." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'custom_requests'), {
        customerId: user.uid,
        customerName: user.displayName || 'Customer',
        customerPhone: '', // Should fetch from profile if available
        services: filteredServices,
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      toast({ title: "Request Submitted", description: "Our team will review your request and get back to you with a quotation." });
      setServices(['']);
      setFormData({ details: '', requestedDate: '', requestedTime: '08:00', staffCount: 1, isQuotationRequested: true });
    } catch (e) {
      toast({ variant: "destructive", title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Custom Service Requests</h1>
          <p className="text-muted-foreground text-sm font-medium">Need something unique? Request a custom cleaning or maintenance plan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* REQUEST FORM */}
        <div className="lg:col-span-7">
          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl"><Zap size={24} /></div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">New Request Engine</CardTitle>
                  <CardDescription className="text-white/40 text-[10px] uppercase font-bold">Configure your special requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Type(s)</Label>
                  <div className="space-y-3">
                    {services.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          value={s} 
                          onChange={e => updateServiceValue(idx, e.target.value)} 
                          placeholder="e.g. Roof Cleaning, Garden Maintenance..." 
                          className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                          required
                        />
                        {services.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceField(idx)} className="h-12 w-12 text-destructive"><Trash2 size={18} /></Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addServiceField} className="w-full h-10 rounded-xl border-dashed border-2 gap-2 text-[10px] font-black uppercase">
                      <Plus size={14} /> Add Another Service
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preferred Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input type="date" value={formData.requestedDate} onChange={e => setFormData({...formData, requestedDate: e.target.value})} className="h-12 pl-11 bg-gray-50 border-none rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Preferred Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input type="time" value={formData.requestedTime} onChange={e => setFormData({...formData, requestedTime: e.target.value})} className="h-12 pl-11 bg-gray-50 border-none rounded-xl" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Required Staff</Label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                      <Input type="number" min="1" value={formData.staffCount} onChange={e => setFormData({...formData, staffCount: parseInt(e.target.value) || 1})} className="h-12 pl-11 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Specific Instructions / Details</Label>
                  <Textarea value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} placeholder="Describe your requirement in detail for an accurate quotation..." className="min-h-[150px] bg-gray-50 border-none rounded-2xl p-6" required />
                </div>

                <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Zap size={20} /></div>
                    <div>
                      <Label className="font-black text-blue-900 uppercase text-xs">Request Quotation</Label>
                      <p className="text-[10px] text-blue-700/70 font-medium">I want to receive a formal price estimate first.</p>
                    </div>
                  </div>
                  <Checkbox 
                    checked={formData.isQuotationRequested} 
                    onCheckedChange={(val) => setFormData({...formData, isQuotationRequested: !!val})} 
                    className="h-6 w-6 rounded-lg"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-tight shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Service Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RECENT REQUESTS LIST */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <History className="text-primary" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Request History</h2>
          </div>

          {isLoading ? (
            <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
          ) : requests?.length ? (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="secondary" className={cn(
                          "text-[8px] font-black uppercase border-none px-2.5 py-1",
                          req.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                          req.status === 'Quoted' ? "bg-blue-50 text-blue-700" :
                          req.status === 'Approved' ? "bg-green-50 text-green-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {req.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-bold mt-1">Submitted: {format(new Date(req.createdAt), 'PP')}</p>
                      </div>
                      {req.price > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Quotation</p>
                          <p className="text-xl font-black text-primary tracking-tighter">৳{req.price}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase text-[#081621] line-clamp-1">{req.services.join(', ')}</p>
                      <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed">"{req.details}"</p>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><Calendar size={12} /> {req.requestedDate}</div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><Users size={12} /> {req.staffCount} Staff</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-primary">Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
              <ClipboardList size={40} className="text-gray-200" />
              <p className="text-xs font-bold uppercase tracking-widest">No custom requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

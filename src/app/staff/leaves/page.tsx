
'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Zap, 
  History, 
  Loader2, 
  Plus, 
  CheckCircle2, 
  Clock,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function StaffLeavesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const leavesQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'leave_requests'), where('staffId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: myRequests, isLoading } = useCollection(leavesQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'leave_requests'), {
        staffId: user.uid,
        staffName: user.displayName || 'Staff',
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Request Submitted", description: "Your leave application is awaiting admin approval." });
      setFormData({ type: 'Sick', startDate: '', endDate: '', reason: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Submission failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-6">
        <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="bg-[#081621] text-white p-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-xl shadow-lg"><Calendar size={24}/></div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-widest">Apply for Leave</CardTitle>
                <CardDescription className="text-white/40 text-[10px] font-bold uppercase">Work-life balance management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Leave Type</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {['Sick', 'Casual', 'Emergency', 'Annual'].map(t => <SelectItem key={t} value={t}>{t} Leave</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required className="h-12 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reason / Note</Label>
                <Textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Briefly explain your requirement..." required className="min-h-[100px] bg-gray-50 border-none rounded-xl p-4" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-[#081621] hover:bg-black shadow-xl gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Zap size={18}/> Submit Application</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] px-2 flex items-center gap-2">
            <History className="text-primary" size={18} /> My Application History
          </h3>
          {isLoading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>
          ) : myRequests?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRequests.map((req) => (
                <Card key={req.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        req.status === 'Approved' ? "bg-green-50 text-green-600" :
                        req.status === 'Rejected' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <Calendar size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-gray-900">{req.type} Leave</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{req.startDate} to {req.endDate}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase px-2 h-6 border-none",
                      req.status === 'Approved' ? "bg-green-50 text-green-700" :
                      req.status === 'Rejected' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    )}>{req.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
              <Briefcase size={40} className="text-gray-100" />
              <p className="text-[10px] font-black uppercase text-gray-400">No applications found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

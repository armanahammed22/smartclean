
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
  Wallet, 
  Zap, 
  History, 
  Loader2, 
  Plus, 
  CheckCircle2, 
  Clock,
  Briefcase,
  Camera,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ui/image-uploader';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function StaffExpensesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: ''
  });

  const claimsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'expense_claims'), where('staffId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: myClaims, isLoading } = useCollection(claimsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'expense_claims'), {
        staffId: user.uid,
        staffName: user.displayName || 'Staff',
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        imageUrl: uploadedUrl,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast({ title: "Claim Submitted", description: "Administrative review in progress." });
      setFormData({ title: '', amount: '', description: '' });
      setUploadedUrl('');
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
              <div className="p-3 bg-emerald-500 rounded-xl shadow-lg"><Wallet size={24}/></div>
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-widest">Expense Claim</CardTitle>
                <CardDescription className="text-white/40 text-[10px] font-bold uppercase">Submit receipts for reimbursement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Expense Title</Label>
                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Transport for Job #123" required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount (৳)</Label>
                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief details about the expenditure..." required className="min-h-[100px] bg-gray-50 border-none rounded-xl p-4" />
                  </div>
                </div>
                <div className="space-y-4">
                  <ImageUploader 
                    label="Attach Receipt" 
                    hint="Photo of bill or voucher"
                    initialUrl={uploadedUrl} 
                    onUpload={setUploadedUrl} 
                    aspectRatio="aspect-square" 
                  />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-[#081621] hover:bg-black shadow-xl gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Zap size={18}/> Submit for Verification</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#081621] px-2 flex items-center gap-2">
            <History className="text-primary" size={18} /> Reclaim History
          </h3>
          {isLoading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>
          ) : myClaims?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myClaims.map((claim) => (
                <Card key={claim.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        claim.status === 'Approved' ? "bg-green-50 text-green-600" :
                        claim.status === 'Rejected' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <FileText size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-gray-900 truncate max-w-[120px]">{claim.title}</p>
                        <p className="text-[11px] font-black text-primary uppercase">৳{claim.amount}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "text-[8px] font-black uppercase px-2 h-6 border-none",
                      claim.status === 'Approved' ? "bg-green-50 text-green-700" :
                      claim.status === 'Rejected' ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                    )}>{claim.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
              <Briefcase size={40} className="text-gray-100" />
              <p className="text-[10px] font-black uppercase text-gray-400">No active claims found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

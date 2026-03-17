
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, HelpCircle, SwitchCamera, SwitchCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function FAQAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ question: '', answer: '', order: 0, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqQuery = useMemoFirebase(() => db ? query(collection(db, 'faq'), orderBy('order', 'asc')) : null, [db]);
  const { data: faqs, isLoading } = useCollection(faqQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.question) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'faq'), formData);
      setFormData({ question: '', answer: '', order: faqs?.length || 0, isActive: true });
      toast({ title: "FAQ Item Created" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'faq', id), { isActive: !current });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this FAQ?")) return;
    await deleteDoc(doc(db, 'faq', id));
    toast({ title: "FAQ Deleted" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-sm">Manage the help section on your homepage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-bold">New FAQ Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Question</Label>
                <Input value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} placeholder="e.g. What is your coverage?" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Answer</Label>
                <Textarea value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} placeholder="Detailed answer..." className="min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Sort Order</Label>
                <Input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="h-11" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold"><Plus size={18} /> Add FAQ</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div> : faqs?.map((faq) => (
            <Card key={faq.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><HelpCircle size={16} /></div>
                    <h4 className="font-bold text-sm text-gray-900">{faq.question}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={faq.isActive} onCheckedChange={() => toggleActive(faq.id, faq.isActive)} />
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDelete(faq.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

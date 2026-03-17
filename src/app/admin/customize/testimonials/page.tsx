
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Star, Loader2, MessageSquare, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Image from 'next/image';

export default function TestimonialsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', role: '', content: '', rating: 5, avatarUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const testimonialsQuery = useMemoFirebase(() => db ? query(collection(db, 'testimonials')) : null, [db]);
  const { data: testimonials, isLoading } = useCollection(testimonialsQuery);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.name) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), formData);
      setFormData({ name: '', role: '', content: '', rating: 5, avatarUrl: '' });
      toast({ title: "Testimonial Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this testimonial?")) return;
    await deleteDoc(doc(db, 'testimonials', id));
    toast({ title: "Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Testimonials</h1>
        <p className="text-muted-foreground text-sm">Manage social proof and customer feedback displays</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-bold">New Testimonial</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <ImageUploader label="Avatar" initialUrl={formData.avatarUrl} aspectRatio="aspect-square w-16" onUpload={(url) => setFormData({...formData, avatarUrl: url})} />
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Customer Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Role / Company</Label>
                <Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="Home Owner" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Review Content</Label>
                <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Fantastic service..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Rating (1-5)</Label>
                <Input type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="h-11" />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-bold"><Plus size={18} /> Add Review</Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials?.map((t) => (
                <Card key={t.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden relative">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        {t.avatarUrl ? <Image src={t.avatarUrl} alt={t.name} fill className="object-cover" /> : <User size={24} className="m-3 text-gray-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{t.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{t.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic leading-relaxed">"{t.content}"</p>
                    <div className="flex items-center gap-1 text-amber-500"><Star size={12} fill="currentColor" /> <span className="text-xs font-black">{t.rating}</span></div>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 size={14} /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

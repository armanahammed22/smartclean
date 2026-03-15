
'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Mail, Phone, Clock, Send, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SupportPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please log in to submit a ticket." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        customerId: user.uid,
        customerEmail: user.email,
        customerName: user.displayName,
        ...formData,
        status: 'Open',
        createdAt: new Date().toISOString()
      });
      setFormData({ subject: '', message: '' });
      toast({ title: "Ticket Submitted", description: "Our team will reply shortly." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send ticket." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-[#F2F4F8] min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-primary p-8 rounded-3xl text-white shadow-xl">
                <h1 className="text-3xl font-black uppercase mb-4 tracking-tight">Need Help?</h1>
                <p className="text-white/80 text-sm leading-relaxed mb-8">Our expert support team is available 24/7 to assist you with any inquiries.</p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl"><Phone size={20} /></div>
                    <div><p className="text-[10px] font-black uppercase opacity-60">Call Us</p><p className="font-bold">+8801919640422</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl"><Mail size={20} /></div>
                    <div><p className="text-[10px] font-black uppercase opacity-60">Email</p><p className="font-bold">support@smartclean.com</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl"><Clock size={20} /></div>
                    <div><p className="text-[10px] font-black uppercase opacity-60">Hours</p><p className="font-bold">Sat-Thu, 8AM - 8PM</p></div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full h-16 rounded-2xl gap-3 text-[#25D366] border-[#25D366] hover:bg-[#25D366]/5 font-black text-lg" asChild>
                <a href="https://wa.me/8801919640422" target="_blank">
                  <MessageCircle size={24} fill="#25D366" className="text-white" />
                  Chat via WhatsApp
                </a>
              </Button>
            </div>

            <div className="lg:col-span-8">
              <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                  <CardTitle className="text-2xl font-black uppercase tracking-tight">Submit Support Ticket</CardTitle>
                  <CardDescription>Tell us what you need help with and we will get back to you.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input placeholder="e.g. Booking Reschedule Request" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>Detailed Message</Label>
                      <Textarea placeholder="Describe your issue in detail..." className="min-h-[200px]" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg gap-2 shadow-lg">
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                      Submit Request
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

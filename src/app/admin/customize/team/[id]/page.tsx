
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Users, 
  ShieldCheck, 
  Info, 
  Smartphone, 
  MessageCircle, 
  Facebook, 
  Linkedin, 
  Instagram,
  Zap,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/ui/image-uploader';
import Link from 'next/link';

export default function TeamMemberEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const isNew = id === 'new';

  const memberRef = useMemoFirebase(() => (db && !isNew) ? doc(db, 'team_members', id as string) : null, [db, id, isNew]);
  const { data: member, isLoading: memberLoading } = useDoc(memberRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    designation: '',
    department: 'Operations',
    image: '',
    bio: '',
    phone: '',
    email: '',
    whatsapp: '',
    experience: 0,
    joiningDate: '',
    serviceArea: '',
    languages: 'Bengali, English',
    rating: 5.0,
    completedJobs: 0,
    facebook: '',
    linkedin: '',
    instagram: '',
    featured: false,
    active: true,
    displayOrder: 0
  });

  useEffect(() => {
    if (member) {
      setFormData({ ...formData, ...member });
    }
  }, [member]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (isNew) {
        await addDoc(collection(db, 'team_members'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Team Member Added" });
      } else {
        await updateDoc(memberRef!, data);
        toast({ title: "Profile Updated" });
      }
      router.push('/admin/customize/team');
    } catch (error) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isNew && memberLoading) return <div className="p-32 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/customize/team')} className="rounded-xl h-10 w-10 border">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">
            {isNew ? 'Enroll New Personnel' : `Edit: ${formData.name}`}
          </h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Personnel Database Entry</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={handleSave} disabled={isSubmitting} className="h-10 px-8 rounded-xl font-black uppercase text-[10px] bg-primary text-white shadow-xl shadow-primary/20 gap-2">
             {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} /> Save Member</>}
           </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Media & Meta */}
        <aside className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-6 border-b">
               <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-[#081621]"><Zap size={14} className="text-primary"/> Profile Media</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <ImageUploader 
                label="Profile Photo" 
                hint="800 x 800 px (1:1 Ratio for Top Section)" 
                initialUrl={formData.image} 
                onUpload={url => setFormData({...formData, image: url})} 
                aspectRatio="aspect-square" 
              />
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-900 leading-relaxed uppercase">ছবি আপলোড গাইড: ছবির উপরের ২ ইঞ্চির জন্য ৮০০x৮০০ পিএক্স ইমেজ ব্যবহার করুন।</p>
              </div>
              
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <Label className="text-[10px] font-black uppercase">Featured Member</Label>
                  <Switch checked={formData.featured} onCheckedChange={v => setFormData({...formData, featured: v})} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <Label className="text-[10px] font-black uppercase">Active Profile</Label>
                  <Switch checked={formData.active} onCheckedChange={v => setFormData({...formData, active: v})} />
                </div>
                <div className="space-y-2 px-1">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Sort Order</Label>
                  <Input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} className="h-10 bg-gray-50 border-none rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right: Data Form */}
        <main className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-gray-100">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
               <CardTitle className="text-lg font-black uppercase flex items-center gap-3 text-[#081621]"><Users size={20} className="text-primary"/> Professional Identity</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Full Legal Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Employee Name" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Designation</Label>
                  <Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required placeholder="e.g. Lead Technician" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Department</Label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Operations" className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Experience (Years)</Label>
                  <Input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: parseInt(e.target.value) || 0})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Professional Biography</Label>
                <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Brief professional overview for the public profile..." className="min-h-[120px] bg-gray-50 border-none rounded-2xl p-6 text-sm leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2"><Smartphone size={12}/> Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2"><MessageCircle size={12}/> WhatsApp</Label>
                  <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2">Service Region</Label>
                  <Input value={formData.serviceArea} onChange={e => setFormData({...formData, serviceArea: e.target.value})} placeholder="e.g. Uttara, Dhaka" className="h-10 bg-gray-50 border-none rounded-xl font-bold text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-600"><Facebook size={12}/> Facebook URL</Label>
                  <Input value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-indigo-600"><Linkedin size={12}/> LinkedIn URL</Label>
                  <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-pink-600"><Instagram size={12}/> Instagram URL</Label>
                  <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </form>
    </div>
  );
}

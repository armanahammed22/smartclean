'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Loader2, 
  Users, 
  Star, 
  GripVertical,
  CheckCircle2, 
  X,
  PlusCircle,
  Smartphone,
  MessageCircle,
  Facebook,
  Linkedin,
  Instagram,
  Briefcase,
  MapPin,
  Calendar,
  Languages,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from 'next/image';

export default function TeamManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const teamQuery = useMemoFirebase(() => 
    db ? collection(db, 'team_members') : null, [db]);
  const { data: teamRaw, isLoading } = useCollection(teamQuery);

  const team = useMemo(() => {
    if (!teamRaw) return [];
    return [...teamRaw].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [teamRaw]);

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
    languages: '',
    rating: 5.0,
    completedJobs: 0,
    facebook: '',
    linkedin: '',
    instagram: '',
    featured: false,
    active: true,
    displayOrder: 0
  });

  const handleOpenDialog = (member: any = null) => {
    if (member) {
      setEditingMember(member);
      setFormData(member);
    } else {
      setEditingMember(null);
      setFormData({
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
        languages: '',
        rating: 5.0,
        completedJobs: 0,
        facebook: '',
        linkedin: '',
        instagram: '',
        featured: false,
        active: true,
        displayOrder: team?.length || 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingMember) {
        await updateDoc(doc(db, 'team_members', editingMember.id), data);
        toast({ title: "Profile Updated" });
      } else {
        await addDoc(collection(db, 'team_members'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Team Member Added" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Operation Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Permanently remove this team member?")) return;
    try {
      await deleteDoc(doc(db, 'team_members', id));
      toast({ title: "Member Removed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Team Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage public profiles for the "Meet Our Team" section</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 font-black h-11 px-8 rounded-xl shadow-xl shadow-primary/20 uppercase tracking-tighter">
          <Plus size={18} /> Add New Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>
        ) : team?.map((member) => (
          <Card key={member.id} className={cn("border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100", !member.active && "opacity-60 grayscale")}>
            <div className="relative aspect-[4/5] overflow-hidden">
              {member.image ? (
                <Image src={member.image} alt={member.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><Users size={64} /></div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {member.featured && <Badge className="bg-primary text-white border-none uppercase font-black text-[8px] px-2 py-0.5">Featured</Badge>}
                {!member.active && <Badge variant="destructive" className="uppercase font-black text-[8px] px-2 py-0.5">Inactive</Badge>}
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-base leading-none">{member.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{member.designation}</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold h-9 gap-2 text-[10px] uppercase" onClick={() => handleOpenDialog(member)}>
                  <Edit size={14} /> Edit
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive rounded-xl hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!team?.length && !isLoading && (
          <div className="col-span-full p-20 text-center border-2 border-dashed rounded-[3rem] bg-white text-muted-foreground italic flex flex-col items-center gap-4">
            <Users size={48} className="text-gray-200" />
            <p className="font-bold uppercase text-xs">No Team Members Registered</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] rounded-none md:rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col overflow-hidden bg-white">
          <header className="p-6 md:p-8 bg-[#081621] text-white shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl shadow-xl"><Users size={24}/></div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">{editingMember ? 'Update Profile' : 'Add New Member'}</DialogTitle>
                <p className="text-white/40 font-bold uppercase text-[9px]">Public Identity Management</p>
              </div>
            </div>
            <button onClick={() => setIsDialogOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"><X size={24}/></button>
          </header>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <aside className="lg:col-span-4 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-900 uppercase">Image Standard</p>
                      <p className="text-[11px] font-medium text-amber-800 leading-tight">
                        টিম কার্ডের উপরের ২ ইঞ্চির জন্য **৮০০ x ৮০০ px (১:১ রেশিও)** এর ছবি ব্যবহার করুন।
                      </p>
                    </div>
                  </div>
                  <ImageUploader 
                    label="Profile Photo" 
                    hint="800 x 800 px (1:1 Ratio for Top Section)" 
                    initialUrl={formData.image} 
                    onUpload={url => setFormData({...formData, image: url})} 
                    aspectRatio="aspect-square" 
                  />
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
                    <Label className="text-[10px] font-black uppercase">Sort Order</Label>
                    <Input type="number" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} className="h-10 bg-gray-50 border-none rounded-xl" />
                  </div>
                </div>
              </aside>

              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Full Name</Label>
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
                  <Label className="text-[10px] font-black uppercase ml-1">Short Bio</Label>
                  <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Brief professional overview..." className="min-h-[100px] bg-gray-50 border-none rounded-2xl p-4 text-sm" />
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
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2">Rating</Label>
                    <Input type="number" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value) || 0})} className="h-10 bg-gray-50 border-none rounded-xl font-black text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-600"><Facebook size={12}/> Facebook</Label>
                    <Input value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-indigo-600"><Linkedin size={12}/> LinkedIn</Label>
                    <Input value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase flex items-center gap-2 text-pink-600"><Instagram size={12}/> Instagram</Label>
                    <Input value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="h-10 bg-gray-50 border-none rounded-xl text-[10px]" />
                  </div>
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="p-6 md:p-8 bg-gray-50 border-t shrink-0 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Discard</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="rounded-xl font-black px-12 h-14 shadow-xl uppercase text-xs tracking-widest">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Sync Profile</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

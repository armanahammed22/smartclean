
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Phone, Mail, MapPin, Save, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

export default function ProfileSettingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Updated to 'users' collection
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profileRef) return;
    setIsSaving(true);

    try {
      // 1. Update Firestore Profile in 'users' collection
      await updateDoc(profileRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        updatedAt: new Date().toISOString()
      });

      // 2. Update Auth Profile
      await updateProfile(user, { displayName: formData.name });

      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="text-primary" size={20} /> Personal Information
              </CardTitle>
              <CardDescription>Details that will be used for your bookings.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address (Read Only)</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={user?.email || ''} 
                      disabled 
                      className="h-12 pl-11 rounded-xl bg-gray-100 border-transparent opacity-60" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Default Service Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                      placeholder="Enter your street address, building, and area"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full md:w-fit px-10 h-12 font-black rounded-xl gap-2 shadow-lg shadow-primary/20">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-8">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} /> Security
              </CardTitle>
              <CardDescription>Manage your password and authentication.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">Change Password</p>
                  <p className="text-xs text-muted-foreground">Receive a reset link via your registered email.</p>
                </div>
                <Button variant="outline" className="h-11 rounded-xl font-bold gap-2">
                  <Lock size={16} /> Send Reset Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150"><User size={120} /></div>
            <CardContent className="p-10 space-y-6 relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-black">
                {user?.displayName?.[0] || 'U'}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">{user?.displayName}</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">ID: {user?.uid.slice(0, 8)}</p>
              </div>
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold opacity-60">Status</span>
                  <span className="font-black bg-white/20 px-3 py-1 rounded-full">ACTIVE USER</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold opacity-60">Member Since</span>
                  <span className="font-black">{profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2026'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

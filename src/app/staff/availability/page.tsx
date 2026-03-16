
'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, MapPin, Loader2, Save, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StaffAvailabilityPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const availabilityRef = useMemoFirebase(() => user ? doc(db!, 'staff_availability', user.uid) : null, [db, user]);
  const { data: availability, isLoading } = useDoc(availabilityRef);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!availabilityRef) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      isOnline: formData.get('isOnline') === 'on',
      activeCity: formData.get('activeCity'),
      preferredShift: formData.get('preferredShift'),
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(availabilityRef, data, { merge: true });
      toast({ title: "Preferences Saved", description: "Your availability has been updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Save failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm" asChild>
            <Link href="/staff/dashboard"><ArrowLeft size={20} /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Availability</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Schedule Management</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 p-8 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="text-primary" size={20} /> Shift Preferences
            </CardTitle>
            <CardDescription>Configure when you are ready to receive new jobs.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="space-y-1">
                <Label className="text-sm font-black text-gray-900 uppercase">Live Active Status</Label>
                <p className="text-xs text-muted-foreground font-medium">Switch ON to start receiving booking notifications.</p>
              </div>
              <Switch name="isOnline" defaultChecked={availability?.isOnline} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Preferred City</Label>
                <Select name="activeCity" defaultValue={availability?.activeCity || "dhaka"}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none font-bold rounded-xl">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dhaka">Dhaka (Central)</SelectItem>
                    <SelectItem value="chattogram">Chittagong</SelectItem>
                    <SelectItem value="sylhet">Sylhet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Shift Type</Label>
                <Select name="preferredShift" defaultValue={availability?.preferredShift || "full_day"}>
                  <SelectTrigger className="h-12 bg-gray-50 border-none font-bold rounded-xl">
                    <SelectValue placeholder="Select Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8AM - 2PM)</SelectItem>
                    <SelectItem value="evening">Evening (2PM - 8PM)</SelectItem>
                    <SelectItem value="full_day">Full Day (8AM - 8PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-[#081621] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={100} /></div>
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-black uppercase tracking-tight">Save Changes</h3>
              <p className="text-white/60 text-xs font-medium">Changes to status take effect immediately in the management console.</p>
            </div>
            <Button type="submit" disabled={isSaving} className="h-14 px-12 rounded-xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl min-w-[200px] uppercase tracking-tighter">
              {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} className="mr-2" /> Sync Profile</>}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

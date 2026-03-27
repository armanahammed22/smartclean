
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Save, Loader2, Navigation, Settings2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TrackingSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'tracking') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    googleMapsApiKey: '',
    trackingInterval: 30,
    isTrackingEnabled: true,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        googleMapsApiKey: config.googleMapsApiKey || '',
        trackingInterval: config.trackingInterval || 30,
        isTrackingEnabled: config.isTrackingEnabled ?? true,
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'site_settings', 'tracking'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Tracking Configuration Saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Live Tracking Configuration</h1>
        <p className="text-muted-foreground text-sm font-medium">Manage team leader geolocation and interval settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl text-primary"><Navigation size={20} /></div>
                  Fleet Control
                </CardTitle>
                <Switch 
                  checked={formData.isTrackingEnabled} 
                  onCheckedChange={(val) => setFormData({...formData, isTrackingEnabled: val})} 
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Google Maps API Key</Label>
                  <Input 
                    type="password"
                    value={formData.googleMapsApiKey} 
                    onChange={(e) => setFormData({...formData, googleMapsApiKey: e.target.value})}
                    placeholder="AIzaSy..."
                    className="h-12 bg-gray-50 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tracking Interval (Seconds)</Label>
                  <Input 
                    type="number"
                    value={formData.trackingInterval} 
                    onChange={(e) => setFormData({...formData, trackingInterval: parseInt(e.target.value) || 30})}
                    className="h-12 bg-gray-50 border-none rounded-xl"
                  />
                  <p className="text-[9px] text-muted-foreground italic px-1">Lower interval uses more battery but provides smoother live tracking.</p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Sync Fleet Protocol
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-[#081621] rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-base font-black uppercase tracking-widest text-primary">Fleet Intelligence</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-primary mt-1" />
                <p className="text-xs font-medium text-white/60 leading-relaxed">
                  Only the **Team Leader's** location is tracked during an active job.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-primary mt-1" />
                <p className="text-xs font-medium text-white/60 leading-relaxed">
                  Location data is wiped from active state once the job is marked as **Completed**.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

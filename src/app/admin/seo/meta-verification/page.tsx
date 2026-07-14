'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Save, Loader2, Info, CheckCircle2, Zap, Globe, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MetaVerificationSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [token, setToken] = useState('');

  useEffect(() => {
    if (settings) {
      setToken(settings.metaDomainVerification || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), { metaDomainVerification: token }, { merge: true });
      toast({ title: "Verification Saved", description: "Meta Domain Verification tag updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Meta Domain Verification</h1>
        <p className="text-muted-foreground text-sm font-medium">Verify your domain ownership for Facebook Business Manager</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <ShieldCheck size={24} className="text-primary" /> Meta Tag Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Verification Token or HTML Tag</Label>
                <Input 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste code here..."
                  className="h-14 bg-gray-50 border-none rounded-xl font-mono text-sm focus:bg-white transition-all px-6"
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-700 mt-2">
                  <AlertCircle size={14} className="shrink-0" /> 
                  <span>আপনি চাইলে ফেসবুক থেকে পাওয়া পুরো মেটা ট্যাগটি এখানে পেস্ট করতে পারেন। সিস্টেম নিজে থেকেই প্রয়োজনীয় অংশটুকু নিয়ে নেবে।</span>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm"><CheckCircle2 size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs text-blue-900">Facebook Business Security</h4>
                  <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                    এই কোডটি সেভ করার পর ফেসবুক বিজনেস ম্যানেজারে গিয়ে "Verify Domain" বাটনে ক্লিক করুন। ভেরিফিকেশন মেথড হিসেবে "Add a meta-tag to your HTML source code" সিলেক্ট করতে ভুলবেন না।
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Authorize Domain
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-100 rounded-3xl p-8 border border-gray-200">
            <h3 className="font-black uppercase text-xs text-gray-900 tracking-widest mb-4 flex items-center gap-2"><Search size={16} /> সঠিক ইনপুট গাইড</h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              ফেসবুক থেকে আপনাকে নিচের মতো একটি কোড দেওয়া হবে:
              <br /><br />
              <code className="bg-white p-3 rounded-lg block border text-[9px] break-all leading-normal text-primary">
                &lt;meta name="facebook-domain-verification" content="<strong>abc123xyz4567890</strong>" /&gt;
              </code>
              <br />
              আপনি উপরের পুরো লাইনটি এখানে পেস্ট করতে পারেন, অথবা শুধুমাত্র বোল্ড করা <strong>abc123xyz4567890</strong> অংশটুকু দিতে পারেন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

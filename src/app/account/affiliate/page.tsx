'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Users, Wallet, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AffiliatePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState('');

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && profile?.referralCode) {
      setReferralLink(`${window.location.origin}/signup?ref=${profile.referralCode}`);
    }
  }, [profile?.referralCode]);

  const referralsQuery = useMemoFirebase(() => 
    user ? query(collection(db, 'referrals'), where('referrerId', '==', user.uid)) : null, [db, user]);
  const { data: referrals } = useCollection(referralsQuery);

  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link Copied!", description: "Share it with your friends." });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
          <p className="text-muted-foreground text-sm">Earn commissions by inviting friends to Smart Clean.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100">
          <Trophy size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Active Partner</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-primary text-white p-8">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Your Referral Link</CardTitle>
            <CardDescription className="text-white/70">Share this link to start earning rewards instantly.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="h-12 bg-gray-50 border-gray-200 font-medium text-sm" />
              <Button onClick={copyToClipboard} size="icon" className="h-12 w-12 shrink-0"><Copy size={20} /></Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {[
                { icon: Users, label: "Step 1", desc: "Friend joins using link" },
                { icon: Wallet, label: "Step 2", desc: "They book a service" },
                { icon: Trophy, label: "Step 3", desc: "You get ৳500 credit" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-3 bg-white rounded-full text-primary shadow-sm"><step.icon size={20} /></div>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-primary">{step.label}</p>
                  <p className="text-xs font-bold leading-tight">{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader><CardTitle className="text-lg font-bold">Earnings Summary</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Total Earned</p>
              <p className="text-3xl font-black text-primary">৳{profile?.totalEarnings || 0}</p>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Referrals</span>
                <span className="font-bold">{referrals?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Pending Credit</span>
                <span className="font-bold">৳0</span>
              </div>
              <Button className="w-full gap-2 font-bold"><Wallet size={16} /> Withdraw Earnings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Mail, Lock, User, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', otp: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  // OTP Logic
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(settingsRef);
  const isOtpEnabled = !!globalSettings?.otpEnabled;

  const checkExistingUser = async (phone: string) => {
    if (!db) return false;
    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      // If permission fails, we assume we can't check publicly and proceed to let Firebase Auth handle uniqueness
      return false;
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Phone" });
      return;
    }
    
    setIsLoading(true);
    const exists = await checkExistingUser(cleanPhone);
    if (exists) {
      toast({ variant: "destructive", title: t('phone_exists_error') });
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const mock = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mock);
      setIsOtpSent(true);
      setIsLoading(false);
      console.log("Signup OTP (MOCK):", mock);
      toast({ title: t('otp_sent'), description: `Code: ${mock}` });
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (formData.otp === generatedOtp) {
      setIsVerified(true);
      toast({ title: t('otp_verified') });
    } else {
      toast({ variant: "destructive", title: t('invalid_otp') });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast({ variant: "destructive", title: "Phone number is required." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch" });
      return;
    }
    
    if (!agreed) {
      toast({ variant: "destructive", title: "Terms & Conditions" });
      return;
    }

    if (isOtpEnabled && !isVerified) {
      toast({ variant: "destructive", title: "Phone Verification Required" });
      return;
    }

    setIsLoading(true);
    try {
      // Robust email generation for Firebase Auth
      const emailToUse = formData.email?.trim().toLowerCase() || `${cleanPhone}@smartclean.local`;

      if (!auth) throw new Error("Authentication service is unavailable.");

      const { user } = await createUserWithEmailAndPassword(auth, emailToUse, formData.password);
      await updateProfile(user, { displayName: formData.name });
      
      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: formData.name,
          email: formData.email?.toLowerCase() || null,
          phone: cleanPhone,
          totalEarnings: 0,
          createdAt: new Date().toISOString(),
          role: 'customer',
          status: 'active'
        }, { merge: true });
      }

      toast({ title: "Account Created!" });
      router.push('/account/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = "This email or phone is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Invalid email format.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      }
      toast({ variant: "destructive", title: "Signup Failed", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10 px-10">
          <div className="flex justify-center mb-4"><div className="p-4 bg-primary/10 rounded-2xl text-primary"><UserPlus size={40} /></div></div>
          <CardTitle className="text-3xl font-black uppercase font-headline tracking-tighter">Create Account</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">Join the Smart Clean network today</CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('full_name')}</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('phone_number')}</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" placeholder="01XXXXXXXXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required disabled={isVerified} />
              </div>
            </div>

            {isOtpEnabled && !isVerified && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                {!isOtpSent ? (
                  <Button type="button" onClick={handleSendOtp} className="w-full h-11 rounded-xl font-bold gap-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Phone size={16} />} {t('send_otp')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="6-digit code" className="bg-white rounded-xl h-11 text-center font-black tracking-widest" value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value})} />
                    <Button type="button" onClick={handleVerifyOtp} className="h-11 px-6 rounded-xl font-black">VERIFY</Button>
                  </div>
                )}
              </div>
            )}

            {isVerified && <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-xl border border-green-100"><CheckCircle2 size={18} /> Verified Phone</div>}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('email_optional')}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" type="email" placeholder="john@example.com (optional)" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <Input className="h-12 rounded-xl bg-gray-50 border-gray-100" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm</Label>
                <Input className="h-12 rounded-xl bg-gray-50 border-gray-100" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
              </div>
            </div>

            <div className="flex items-start space-x-3 px-1 pt-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={(val) => setAgreed(!!val)} className="rounded-md border-gray-300 mt-0.5" />
              <label htmlFor="terms" className="text-[11px] leading-tight text-gray-600 font-bold cursor-pointer">Agree to terms & conditions</label>
            </div>

            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight active:scale-95 transition-transform" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50/50 border-t py-6">
          <p className="text-xs font-bold text-muted-foreground">Already have an account? <Link href="/login" className="text-primary font-black hover:underline">Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
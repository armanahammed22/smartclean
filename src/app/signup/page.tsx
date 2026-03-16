
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Mail, Lock, User, Phone, ShieldAlert, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const checkBlockStatus = async (email: string, phone: string) => {
    if (!db) return false;
    
    // Check email block
    const emailQ = query(collection(db, 'blocked_users'), where('email', '==', email.toLowerCase()));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) return true;

    // Check phone block
    const phoneQ = query(collection(db, 'blocked_users'), where('phone', '==', phone));
    const phoneSnap = await getDocs(phoneQ);
    if (!phoneSnap.empty) return true;

    return false;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch", description: "The passwords you entered do not match." });
      return;
    }

    if (!agreed) {
      toast({ variant: "destructive", title: "Terms & Conditions", description: "Please agree to the terms to continue." });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check if user is blocked
      const isBlocked = await checkBlockStatus(formData.email, formData.phone);
      if (isBlocked) {
        toast({ 
          variant: "destructive", 
          title: "Registration Denied", 
          description: "This email or phone number is blocked and cannot be used for registration." 
        });
        setIsLoading(false);
        return;
      }

      // 2. Create Auth Account
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(user, { displayName: formData.name });
      
      const referralCode = user.uid.slice(0, 6).toUpperCase();
      const referredBy = searchParams.get('ref') || null;

      // 3. Create Firestore Profile in the 'users' collection
      await setDoc(doc(db!, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        referralCode,
        referredBy,
        totalEarnings: 0,
        createdAt: new Date().toISOString(),
        role: 'customer',
        status: 'active'
      }, { merge: true });

      toast({ title: "Account Created!", description: "Welcome to the Smart Clean family." });
      router.push('/account/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <UserPlus size={40} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight uppercase font-headline">Create Account</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Join thousands of happy customers in Bangladesh
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" placeholder="017XXXXXXXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 px-1 pt-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={(val) => setAgreed(!!val)} className="rounded-md border-gray-300 mt-0.5" />
              <label htmlFor="terms" className="text-[11px] leading-tight text-gray-600 font-bold">
                I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl shadow-primary/20 mt-4 uppercase tracking-tight" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50/50 border-t py-6">
          <p className="text-xs font-bold text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-black">Sign In</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

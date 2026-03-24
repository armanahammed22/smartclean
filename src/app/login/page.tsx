'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LayoutDashboard, HardHat, User, ShieldAlert, HelpCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Role Checks
  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const staffRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: staffRoleLoading } = useDoc(staffRef);

  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;
  const isStaff = !!staffRole;

  // Auto-Redirection after login
  useEffect(() => {
    if (user && !roleLoading && !staffRoleLoading) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isStaff) {
        router.push('/staff/dashboard');
      } else {
        router.push('/account/dashboard');
      }
    }
  }, [user, isAdmin, isStaff, roleLoading, staffRoleLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast({ title: "Welcome Back!", description: "Determining access level..." });
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "Invalid credentials." 
      });
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Phone" });
      return;
    }
    setIsLoading(true);
    
    if (db) {
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "User Not Found", description: "This phone number is not registered." });
        setIsLoading(false);
        return;
      }
    }

    setTimeout(() => {
      const mock = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mock);
      setIsOtpSent(true);
      setIsLoading(false);
      toast({ title: t('otp_sent'), description: `Code: ${mock}` });
    }, 1000);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== generatedOtp) {
      toast({ variant: "destructive", title: t('invalid_otp') });
      return;
    }

    setIsLoading(true);
    toast({ title: "Verification Successful", description: "Determining access level..." });
    // In a real OTP system, you'd verify with Firebase. This is currently simulated.
    router.push('/account/dashboard');
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.refresh();
    }
  };

  if (isUserLoading || (user && (roleLoading || staffRoleLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10">
          <div className="flex justify-center mb-4"><div className="p-4 bg-primary/10 rounded-2xl text-primary"><User size={40} /></div></div>
          <CardTitle className="text-3xl font-black tracking-tight uppercase">Customer Portal</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">Sign in to manage your bookings</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl h-12">
              <TabsTrigger value="phone" className="rounded-lg font-black uppercase text-[10px] tracking-widest">{t('phone_login')}</TabsTrigger>
              <TabsTrigger value="email" className="rounded-lg font-black uppercase text-[10px] tracking-widest">{t('email_login')}</TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-5">
              <form onSubmit={handlePhoneLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('phone_number')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isOtpSent} />
                  </div>
                </div>

                {!isOtpSent ? (
                  <Button type="button" onClick={handleSendOtp} className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null} {t('send_otp')}
                  </Button>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('enter_otp')}</Label>
                      <Input className="h-12 rounded-xl bg-gray-50 border-gray-100 text-center text-xl font-black tracking-[0.5em]" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin mr-2" /> : null} Sign In
                    </Button>
                    <Button variant="link" type="button" onClick={() => setIsOtpSent(false)} className="w-full text-xs font-bold text-muted-foreground">Change Phone Number</Button>
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-5">
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="name@example.com" className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-10 bg-gray-50/50 pt-6">
          <p className="text-xs font-bold text-muted-foreground">Don't have an account? <Link href="/signup" className="text-primary hover:underline font-black">Register Now</Link></p>
          <div className="flex gap-4 pt-2">
            <Link href="/admin/login" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary">Admin Access</Link>
            <Link href="/staff/login" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-amber-600">Staff Portal</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

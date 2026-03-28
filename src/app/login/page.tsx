
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const staffRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: staffRoleLoading } = useDoc(staffRef);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const isBootstrap = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_UIDS.includes(user.uid);
    return isBootstrap || !!adminRole;
  }, [adminRole, user]);

  const isStaff = !!staffRole;

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  // Auto-redirect on auth state change
  useEffect(() => {
    if (!user || isUserLoading) return;

    if (isAdmin) {
      router.replace('/admin/dashboard');
    } else if (!roleLoading && !staffRoleLoading) {
      if (isStaff) {
        router.replace('/staff/dashboard');
      } else {
        router.replace('/account/dashboard');
      }
    }
  }, [user, isUserLoading, isAdmin, isStaff, roleLoading, staffRoleLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    
    try {
      console.log("[Auth] Attempting login for:", trimmedEmail);
      const credentials = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const uid = credentials.user.uid;

      const isBootstrapAdmin = trimmedEmail === BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_UIDS.includes(uid);

      if (isBootstrapAdmin) {
        console.log("[Auth] Bootstrap Admin Detected. Forcing Admin Profile Sync.");
        // Ensure Firestore has the profile
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: credentials.user.displayName || 'Root Admin',
          email: trimmedEmail,
          role: 'admin',
          status: 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });

        await setDoc(doc(db, 'roles_admins', uid), {
          uid,
          assignedAt: serverTimestamp()
        }, { merge: true });

        toast({ title: "Authorized", description: "Admin terminal accessed." });
        router.replace('/admin/dashboard');
        return;
      }

      // Standard Role Check
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        toast({ variant: "destructive", title: "Profile Error", description: "Account profile not found in database." });
        setIsLoading(false);
        return;
      }

      const role = userSnap.data()?.role;
      if (['admin', 'manager', 'accounts', 'order_manager'].includes(role)) {
        router.replace('/admin/dashboard');
      } else if (['staff', 'technician'].includes(role)) {
        router.replace('/staff/dashboard');
      } else {
        router.replace('/account/dashboard');
      }

    } catch (error: any) {
      console.error("[Login] Auth Error:", error.code, error.message);
      let message = "Invalid email or password.";
      if (error.code === 'auth/network-request-failed') message = "Network error. Please check your internet.";
      if (error.code === 'auth/user-disabled') message = "This account has been disabled.";
      
      toast({ variant: "destructive", title: "Login Failed", description: message });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Handshake...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-[#081621] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <Image src="https://picsum.photos/seed/cleanlogin/1200/1200" alt="Background" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-br from-[#081621] via-[#081621]/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="space-y-4">
            <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Global Terminal</Badge>
            <h2 className="text-5xl font-black text-white leading-tight uppercase tracking-tighter italic font-headline">
              Management <br /><span className="text-primary">Protocol.</span>
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed">Secure access to Smart Clean operations, inventory, and staff coordination.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest mb-4">
            <ArrowLeft size={16} /> Exit Terminal
          </Link>

          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white animate-in fade-in duration-500">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="space-y-4 text-center pt-10 px-8">
              <div className="flex justify-center">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md">
                  {displayLogo ? <Image src={displayLogo} alt="Logo" fill className="object-contain" unoptimized /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-xl">S</div>}
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter uppercase font-headline text-[#081621]">System Access</CardTitle>
                <CardDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Enter credentials to synchronize</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-8 pb-6 pt-4">
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="admin@smartclean.bd" className="h-12 md:h-14 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 md:h-14 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 md:h-16 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight bg-primary hover:bg-primary/90 transition-all active:scale-95 gap-3" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Login Terminal</>}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 bg-gray-50/50 py-6 border-t text-center">
              <Link href="/secure-admin-portal" className="text-[10px] font-black uppercase text-primary/60 hover:text-primary flex items-center justify-center gap-2">
                <ShieldCheck size={14} /> Master Portal Access
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

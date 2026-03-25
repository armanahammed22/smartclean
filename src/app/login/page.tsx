
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

/**
 * Optimized Customer-Only Login Page
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Role Checks to filter non-customers
  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const staffRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: staffRoleLoading } = useDoc(staffRef);

  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID || user?.email === BOOTSTRAP_ADMIN_EMAIL;
  const isStaff = !!staffRole;

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  useEffect(() => {
    if (user && !roleLoading && !staffRoleLoading) {
      if (isAdmin || isStaff) {
        // Restricted Role logged into Customer Portal
        setAccessDenied(true);
        toast({ 
          variant: "destructive", 
          title: "Restricted Access", 
          description: "This portal is for customers only. Please use the designated staff or admin login." 
        });
        if (auth) signOut(auth); // Clear session
      } else {
        // Genuine Customer
        router.replace('/account/dashboard');
      }
    }
  }, [user, isAdmin, isStaff, roleLoading, staffRoleLoading, router, auth, toast]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    setAccessDenied(false);
    
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "Invalid credentials." 
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading || (user && (roleLoading || staffRoleLoading))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verifying Identity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      {/* 📱 Focused Mobile Header */}
      <Link href="/" className="mb-6 flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Site
      </Link>

      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-4 text-center pt-10 px-8">
          <div className="flex justify-center">
            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border border-gray-100 shadow-sm p-2 bg-white">
              {displayLogo ? (
                <Image src={displayLogo} alt="Logo" fill className="object-contain p-2" unoptimized />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-xl">S</div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter uppercase font-headline text-[#081621]">Customer Login</CardTitle>
            <CardDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Smart Clean Network</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-8 pt-4">
          {accessDenied && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in shake-1">
              <ShieldAlert className="text-red-600 shrink-0" size={20} />
              <p className="text-[11px] font-bold text-red-700 leading-tight">
                ACCESS DENIED: Staff or Admin credentials cannot be used on the customer portal. Please contact management.
              </p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-12 md:h-14 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold text-base" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link href="#" className="text-[10px] font-black text-primary uppercase">Forgot Password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 md:h-14 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold text-base" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-2">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 md:h-16 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight bg-primary hover:bg-primary/90 transition-all active:scale-95 gap-3" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
              Login to Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pb-10 bg-gray-50/50 pt-8 border-t border-gray-100">
          <p className="text-xs font-bold text-muted-foreground text-center">
            New to Smart Clean? <Link href="/signup" className="text-primary hover:underline font-black uppercase tracking-widest ml-1">Create Account</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

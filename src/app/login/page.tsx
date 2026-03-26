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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn, ArrowLeft, ShieldAlert, UserPlus, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/components/providers/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  
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

  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID || user?.email === BOOTSTRAP_ADMIN_EMAIL;
  const isStaff = !!staffRole;

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings } = useDoc(settingsRef);
  const displayLogo = settings?.logoUrl || PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl;

  useEffect(() => {
    if (user && !roleLoading && !staffRoleLoading) {
      if (isAdmin || isStaff) {
        setAccessDenied(true);
        toast({ 
          variant: "destructive", 
          title: "Restricted Access", 
          description: "This portal is for customers only. Please use the designated staff or admin login." 
        });
        if (auth) signOut(auth);
      } else {
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
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      
      {/* Visual Branding Section - Visible on Desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#081621] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <Image 
            src="https://picsum.photos/seed/cleanlogin/1200/1200" 
            alt="Background" 
            fill 
            className="object-cover" 
            unoptimized 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#081621] via-[#081621]/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="space-y-4">
            <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Premium Care</Badge>
            <h2 className="text-5xl font-black text-white leading-tight uppercase tracking-tighter italic font-headline">
              Your Space, <br />
              <span className="text-primary">Our Passion.</span>
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed">
              Experience the smartest cleaning services in Bangladesh. Professional, reliable, and just a click away.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: "Verified Pros", icon: CheckCircle2 },
              { label: "Secure Payment", icon: ShieldCheck },
              { label: "Modern Tech", icon: Zap },
              { label: "Instant Booking", icon: Sparkles }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <feature.icon className="text-primary" size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="w-full max-w-md space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest mb-4">
            <ArrowLeft size={16} /> Back to Site
          </Link>

          <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="h-2 bg-primary w-full" />
            <CardHeader className="space-y-4 text-center pt-10 px-8">
              <div className="flex justify-center">
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-md">
                  {displayLogo ? (
                    <Image src={displayLogo} alt="Logo" fill className="object-contain" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-xl">S</div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl md:text-3xl font-black tracking-tighter uppercase font-headline text-[#081621]">Welcome Back</CardTitle>
                <CardDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Customer Secure Login</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="px-8 pb-6 pt-4">
              {accessDenied && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in shake-1">
                  <ShieldAlert className="text-red-600 shrink-0" size={20} />
                  <p className="text-[11px] font-bold text-red-700 leading-tight">
                    ACCESS DENIED: Please use your professional portal for management access.
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
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

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe} 
                      onCheckedChange={(val) => setRememberMe(!!val)} 
                      className="border-gray-300 rounded"
                    />
                    <label htmlFor="remember" className="text-[11px] font-bold text-gray-600 uppercase tracking-tighter cursor-pointer">
                      Remember Me
                    </label>
                  </div>
                  <Link href="#" className="text-[11px] font-black text-primary uppercase tracking-tighter hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <Button type="submit" className="w-full h-14 md:h-16 font-black text-lg rounded-2xl shadow-xl mt-2 uppercase tracking-tight bg-primary hover:bg-primary/90 transition-all active:scale-95 gap-3" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} /> Login Now</>}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pb-10 bg-gray-50/50 pt-8 border-t border-gray-100">
              <div className="text-center space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                  New to Smart Clean?
                </p>
                <Button variant="outline" asChild className="w-full h-12 rounded-xl border-primary/20 bg-white hover:bg-primary/5 text-primary font-black uppercase text-xs gap-2">
                  <Link href="/signup">
                    <UserPlus size={16} /> Create an Account
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

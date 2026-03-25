
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Lock, Eye, EyeOff, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
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

  // 🛡️ Role Checks
  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const staffRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: staffRoleLoading } = useDoc(staffRef);

  const isAdmin = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID || user?.email === BOOTSTRAP_ADMIN_EMAIL;
  const isStaff = !!staffRole;

  // 🚦 Automatic Redirection based on role
  useEffect(() => {
    if (user && !roleLoading && !staffRoleLoading) {
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else if (isStaff) {
        router.replace('/staff/dashboard');
      } else {
        router.replace('/account/dashboard');
      }
    }
  }, [user, isAdmin, isStaff, roleLoading, staffRoleLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast({ title: "Welcome Back!", description: "Authenticating profile..." });
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
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Securely Verifying...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft size={16} /> Back to Site
      </Link>

      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10 px-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/5 rounded-2xl text-primary shadow-inner">
              <User size={40} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight uppercase font-headline">Welcome Back</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Login to your account</CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                <Link href="#" className="text-[10px] font-black text-primary uppercase">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight bg-primary hover:bg-primary/90 transition-all active:scale-95" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" size={20} />}
              Authenticate
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pb-10 bg-gray-50/50 pt-6 border-t border-gray-100">
          <p className="text-xs font-bold text-muted-foreground text-center">
            New here? <Link href="/signup" className="text-primary hover:underline font-black uppercase tracking-widest">Create Profile</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

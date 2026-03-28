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
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const BOOTSTRAP_ADMIN_UIDS = ['Q8QpZP1GzzWf2f2K6WTe476PcD92'];
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function SecureAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const isBootstrap = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_UIDS.includes(user.uid);
    return isBootstrap || !!adminRole;
  }, [adminRole, user]);

  useEffect(() => {
    if (!user || isUserLoading) return;
    if (isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [user, isAdmin, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    
    try {
      const credentials = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const uid = credentials.user.uid;

      const isBootstrapAdmin = trimmedEmail === BOOTSTRAP_ADMIN_EMAIL || BOOTSTRAP_ADMIN_UIDS.includes(uid);

      if (isBootstrapAdmin) {
        // Background sync
        setDoc(doc(db, 'users', uid), {
          uid,
          name: credentials.user.displayName || 'Root Admin',
          email: trimmedEmail,
          role: 'admin',
          status: 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });

        setDoc(doc(db, 'roles_admins', uid), {
          uid,
          assignedAt: serverTimestamp()
        }, { merge: true });

        toast({ title: "Authorized", description: "Admin terminal accessed." });
        router.push('/admin/dashboard');
        return;
      }

      // Check standard admin role
      const userSnap = await getDoc(doc(db, 'users', uid));
      const role = userSnap.data()?.role;

      if (['admin', 'manager', 'accounts', 'order_manager'].includes(role || '')) {
        router.push('/admin/dashboard');
      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "Account is not authorized for administration." });
        setIsLoading(false);
      }

    } catch (error: any) {
      console.error("[Portal] Login Error:", error.code, error.message);
      let message = "Invalid email or access key.";
      if (error.code === 'auth/wrong-password') message = "Incorrect security key.";
      if (error.code === 'auth/user-not-found') message = "Identity not found.";
      
      toast({ variant: "destructive", title: "Access Denied", description: message });
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#081621] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Terminal Authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081621] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white animate-in zoom-in-95 duration-500">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10 px-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <ShieldCheck size={40} />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Secure Admin Portal</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">Internal Management Access Required</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity (Email)</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="admin@smartclean.bd" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-bold" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key (Password)</Label>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-2">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <><LayoutDashboard size={20} /> Authenticate</>}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50/50 py-6 border-t">
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
            Exit to Public Site <ArrowRight size={12} />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

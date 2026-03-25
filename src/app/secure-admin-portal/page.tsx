
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
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';
const BOOTSTRAP_ADMIN_EMAIL = 'smartclean422@gmail.com';

export default function SecureAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const adminRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRef);
  
  const isAdmin = !!adminRole || (user?.uid === BOOTSTRAP_ADMIN_UID) || (user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL);

  useEffect(() => {
    if (user && !roleLoading) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        toast({ 
          variant: "destructive", 
          title: "Unauthorized", 
          description: "Access denied. Redirecting..." 
        });
        if (auth) signOut(auth).then(() => router.push('/'));
      }
    }
  }, [user, isAdmin, roleLoading, router, auth, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Auth Failed", 
        description: "Invalid secure credentials."
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#081621] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10 px-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <ShieldCheck size={40} />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Secure Admin Portal</CardTitle>
          <CardDescription className="text-sm font-medium">Internal Management Access Only</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="admin@smartclean.com" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LayoutDashboard className="mr-2" size={20} />}
              Authenticate
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50/50 py-6 border-t">
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
            Exit to Site <ArrowRight size={12} />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

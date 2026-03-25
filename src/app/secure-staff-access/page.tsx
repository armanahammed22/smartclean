
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
import { Loader2, HardHat, Mail, Lock, Eye, EyeOff, Wrench, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SecureStaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const staffRef = useMemoFirebase(() => user ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole, isLoading: roleLoading } = useDoc(staffRef);
  const isStaff = !!staffRole;

  useEffect(() => {
    if (user && !roleLoading) {
      if (isStaff) {
        router.push('/staff/dashboard');
      } else {
        toast({ 
          variant: "destructive", 
          title: "Unauthorized", 
          description: "Staff access only. Redirecting..." 
        });
        if (auth) signOut(auth).then(() => router.push('/'));
      }
    }
  }, [user, isStaff, roleLoading, router, auth, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid staff credentials." });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-amber-500 w-full" />
        <CardHeader className="space-y-2 text-center pt-10 px-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
              <HardHat size={40} />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Technician Secure Access</CardTitle>
          <CardDescription className="text-sm font-medium">Field Operations Login</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="technician@smartclean.com" 
                  className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Key</Label>
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
            <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl mt-4 uppercase tracking-tight bg-amber-600 hover:bg-amber-700 text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Wrench className="mr-2" size={20} />}
              Authorize Shift
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center bg-gray-50/50 py-6 border-t">
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-2">
            Back to site <ArrowRight size={12} />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

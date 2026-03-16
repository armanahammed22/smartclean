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
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LayoutDashboard, HardHat, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Role Checks for Authenticated View
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRef);
  const isAdmin = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  const staffRef = useMemoFirebase(() => user ? doc(db, 'roles_employees', user.uid) : null, [db, user]);
  const { data: staffRole } = useDoc(staffRef);
  const isStaff = !!staffRole;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({
        title: "Welcome Back!",
        description: "You have successfully signed in.",
      });
      // Initial redirect - roles will be checked via Navbar/Layouts for deeper navigation
      router.push('/account/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2rem] shadow-2xl border-none overflow-hidden bg-white">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-2 text-center pt-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <ShieldCheck size={40} />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight uppercase font-headline">Portal Login</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">
            Sign in to access your dashboard and services
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-4">
          {user ? (
            <div className="p-6 bg-green-50 border border-green-100 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 size={24} />
                <p className="text-sm font-black uppercase tracking-widest">Authenticated</p>
              </div>
              <p className="text-xs font-bold text-gray-600 truncate bg-white/50 p-3 rounded-xl border">{user.email}</p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/account/dashboard')} 
                  className="w-full h-12 bg-white text-gray-900 border hover:bg-gray-50 gap-2 font-black rounded-xl shadow-sm"
                >
                  <User size={18} /> Customer Dashboard
                </Button>

                {isStaff && (
                  <Button 
                    onClick={() => router.push('/staff/dashboard')} 
                    className="w-full h-12 bg-amber-600 hover:bg-amber-700 gap-2 font-black rounded-xl shadow-lg"
                  >
                    <HardHat size={18} /> Staff Portal <ArrowRight size={18} />
                  </Button>
                )}

                {isAdmin && (
                  <Button 
                    onClick={() => router.push('/admin/dashboard')} 
                    className="w-full h-12 bg-[#081621] hover:bg-[#0a253a] gap-2 font-black rounded-xl shadow-lg text-white"
                  >
                    <LayoutDashboard size={18} /> Admin Console <ArrowRight size={18} />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="h-12 pl-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Link href="#" className="text-[10px] font-black text-primary hover:underline">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 pl-11 pr-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 px-1">
                <Checkbox id="remember" className="rounded-md border-gray-300" />
                <label htmlFor="remember" className="text-xs font-bold text-gray-600 cursor-pointer">Remember me for 30 days</label>
              </div>

              <Button type="submit" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl shadow-primary/20 mt-2 uppercase tracking-tight" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-10 bg-gray-50/50 pt-6">
          <p className="text-xs font-bold text-muted-foreground">
            Don't have an account? <Link href="/signup" className="text-primary hover:underline font-black">Register Now</Link>
          </p>
          <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

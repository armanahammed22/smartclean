
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Mail, Lock, AlertCircle, Info, ArrowRight, Globe, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({
        title: "Login Successful",
        description: "Welcome back to the Smart Clean CRM.",
      });
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "An unexpected error occurred.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Authentication failed. Ensure the account exists in the Firebase Console.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error. Ensure your current domain is 'Authorized' in Firebase Console.";
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl shadow-xl border-none overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ShieldCheck size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">CRM Portal Access</CardTitle>
          <CardDescription>
            Enter your credentials to manage Smart Clean operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl space-y-3 mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 size={16} />
                <p className="text-xs font-bold uppercase">Authenticated</p>
              </div>
              <p className="text-sm font-mono truncate bg-white p-2 rounded-xl border">{user.email}</p>
              <Button 
                onClick={() => router.push('/admin/dashboard')} 
                className="w-full bg-green-600 hover:bg-green-700 gap-2 h-10 text-xs font-bold rounded-xl"
              >
                Enter Dashboard <ArrowRight size={14} />
              </Button>
            </div>
          )}

          {!user && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10 h-11 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-11 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg rounded-2xl shadow-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking Credentials...
                  </>
                ) : (
                  "Sign In to ERP"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pb-6">
          <Button variant="link" className="text-xs text-muted-foreground rounded-full" onClick={() => router.push('/')}>
            Back to Public Website
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

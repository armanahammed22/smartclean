
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, Mail, Lock, AlertCircle, Info, ArrowRight, Globe } from 'lucide-react';
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

  // If already logged in, show a redirect button
  useEffect(() => {
    if (user && !isUserLoading) {
      // We don't auto-redirect here to avoid loops if they are unauthorized
    }
  }, [user, isUserLoading]);

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
        message = "Invalid credentials. Please ensure you have created this account in your Firebase Console (Authentication tab).";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        message = "Network error. Please ensure your development domain is added to 'Authorized domains' in Firebase Console > Authentication > Settings.";
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
      <Card className="w-full max-w-md rounded-2xl shadow-xl border-none overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ShieldCheck size={32} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline">CRM Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the management portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-3 mb-4">
              <p className="text-xs font-bold text-green-700">You are currently logged in as:</p>
              <p className="text-sm font-mono truncate bg-white p-2 rounded border">{user.email}</p>
              <div className="p-2 bg-white rounded border text-[10px] font-mono break-all text-muted-foreground">
                UID: {user.uid}
              </div>
              <Button 
                onClick={() => router.push('/admin/dashboard')} 
                className="w-full bg-green-600 hover:bg-green-700 gap-2 h-10 text-xs font-bold"
              >
                Enter Dashboard <ArrowRight size={14} />
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-none">
              <AlertCircle size={16} />
              <AlertTitle className="font-bold">Login Problem</AlertTitle>
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3 text-blue-700">
            <div className="flex gap-3">
              <Info size={18} className="shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold uppercase mb-1">Critical Setup Steps:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Enable <strong>Email/Password</strong> in Firebase Auth.</li>
                  <li>Create user <strong>smartclean422@gmail.com</strong>.</li>
                  <li>Assign UID <strong>gcp03WmpjROVvRdpLNsghNU4zHa2</strong> in code.</li>
                </ol>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2 border-t border-blue-200">
              <Globe size={18} className="shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold uppercase mb-1">Network Error? (Whitelist Domain):</p>
                <p>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong> and add your current browser URL (e.g., the workstation domain).</p>
              </div>
            </div>
          </div>

          {!user && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="smartclean422@gmail.com" 
                    className="pl-10 h-11"
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
                    placeholder="admin123" 
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg rounded-xl shadow-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pb-6">
          <Button variant="link" className="text-xs text-muted-foreground" onClick={() => router.push('/')}>
            Back to Public Website
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

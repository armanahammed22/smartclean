'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Terminal, Save, Loader2, Search, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SearchConsoleSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'global') : null, [db]);
  const { data: settings, isLoading } = useDoc(settingsRef);

  const [token, setToken] = useState('');

  useEffect(() => {
    if (settings) {
      setToken(settings.googleSearchConsoleToken || '');
    }
  }, [settings]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'global'), { googleSearchConsoleToken: token }, { merge: true });
      toast({ title: "Verification Saved", description: "Search Console tag updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Google Search Console</h1>
        <p className="text-muted-foreground text-sm font-medium">Verify your ownership and track organic search performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-[#081621] text-white p-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Terminal size={24} className="text-primary" /> Site Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">HTML Tag Verification Content</Label>
                <Input 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste only the 'content' attribute value..."
                  className="h-14 bg-gray-50 border-none rounded-xl font-mono text-sm focus:bg-white transition-all px-6"
                />
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-700 mt-2">
                  <Info size={14} /> Only enter the value inside the content="" attribute.
                </div>
              </div>

              <div className="p-6 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl text-green-600 shadow-sm"><ShieldCheck size={24} /></div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase text-xs text-green-900">Search Engine Indexing</h4>
                  <p className="text-xs text-green-800/70 leading-relaxed font-medium">
                    Search Console helps you submit sitemaps and ensure your pages are being crawled by Google.
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full h-14 rounded-2xl font-black uppercase tracking-tight shadow-xl">
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Publish Verification
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-100 rounded-3xl p-8 border border-gray-200">
            <h3 className="font-black uppercase text-xs text-gray-900 tracking-widest mb-4 flex items-center gap-2"><Search size={16} /> GSC Tooltip</h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When Google asks to verify using <strong>"HTML Tag"</strong>, you will see a line like:
              <br /><br />
              <code className="bg-white p-2 rounded block border text-[9px] break-all">
                &lt;meta name="google-site-verification" content="<strong>YOUR_CODE_HERE</strong>" /&gt;
              </code>
              <br />
              Copy <strong>only</strong> the bold part above and paste it in the field.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  return React.useMemo(factory, deps);
}

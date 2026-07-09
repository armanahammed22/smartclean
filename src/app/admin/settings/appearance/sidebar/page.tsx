'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Loader2, 
  Layout, 
  Eye, 
  Smartphone, 
  Monitor, 
  Type, 
  Zap,
  CheckCircle2,
  Columns,
  LayoutDashboard,
  ShoppingCart,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const DEFAULT_APPEARANCE = {
  bgColor: '#08101b',
  textColor: '#ffffff',
  activeBgColor: 'rgba(255,255,255,0.1)',
  activeTextColor: '#ffffff',
  hoverBgColor: 'rgba(255,255,255,0.05)',
  borderColor: 'rgba(255,255,255,0.05)',
  iconColor: '',
  expandedWidth: '288px',
  collapsedWidth: '80px',
  fontSize: '15px',
  fontWeight: '600'
};

const PRESETS = [
  { id: 'dark', label: 'Classic Dark', colors: { bgColor: '#08101b', textColor: '#ffffff', activeBgColor: 'rgba(255,255,255,0.1)', activeTextColor: '#ffffff', hoverBgColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' } },
  { id: 'blue', label: 'Modern Blue', colors: { bgColor: '#0f172a', textColor: '#f8fafc', activeBgColor: '#2263C0', activeTextColor: '#ffffff', hoverBgColor: 'rgba(34,99,192,0.1)', borderColor: 'rgba(255,255,255,0.1)' } },
  { id: 'light', label: 'Light Pro', colors: { bgColor: '#ffffff', textColor: '#0f172a', activeBgColor: '#f1f5f9', activeTextColor: '#2263C0', hoverBgColor: '#f8fafc', borderColor: '#e2e8f0' } },
  { id: 'emerald', label: 'Emerald Night', colors: { bgColor: '#064e3b', textColor: '#ecfdf5', activeBgColor: '#059669', activeTextColor: '#ffffff', hoverBgColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' } }
];

export default function SidebarAppearancePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const appearanceRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'admin_appearance') : null, [db]);
  const { data: currentAppearance, isLoading } = useDoc(appearanceRef);

  const [formData, setFormData] = useState<any>(DEFAULT_APPEARANCE);

  useEffect(() => {
    if (currentAppearance) {
      setFormData({ ...DEFAULT_APPEARANCE, ...currentAppearance });
    }
  }, [currentAppearance]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'admin_appearance'), formData, { merge: true });
      toast({ title: "Appearance Published", description: "Sidebar styles updated across all devices." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: any) => {
    setFormData({ ...formData, ...preset.colors });
    toast({ title: `${preset.label} Applied`, description: "Click save to publish changes." });
  };

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline text-primary" size={40} /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Sidebar Appearance</h1>
          <p className="text-muted-foreground text-sm font-medium">Customize the visual experience of your administration panel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormData(DEFAULT_APPEARANCE)} className="rounded-xl h-11 px-6 font-bold gap-2">
            <RotateCcw size={16} /> Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Design
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* DESIGN CONTROLS */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                  <Palette size={18} className="text-primary" /> Visual Theme Matrix
                </CardTitle>
              </div>
              <div className="flex gap-2">
                {PRESETS.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => applyPreset(p)}
                    className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                    style={{ backgroundColor: p.colors.bgColor }}
                    title={p.label}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Background</Label>
                  <Input type="color" value={formData.bgColor} onChange={e => setFormData({...formData, bgColor: e.target.value})} className="h-10 p-1" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Text Color</Label>
                  <Input type="color" value={formData.textColor} onChange={e => setFormData({...formData, textColor: e.target.value})} className="h-10 p-1" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Border Color</Label>
                  <Input type="color" value={formData.borderColor} onChange={e => setFormData({...formData, borderColor: e.target.value})} className="h-10 p-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2"><CheckCircle2 size={14}/> Active State</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Active Bg</Label>
                      <Input value={formData.activeBgColor} onChange={e => setFormData({...formData, activeBgColor: e.target.value})} className="h-10 bg-gray-50 border-none" placeholder="e.g. #000 or rgba()" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Active Text</Label>
                      <Input type="color" value={formData.activeTextColor} onChange={e => setFormData({...formData, activeTextColor: e.target.value})} className="h-10 p-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2"><Zap size={14}/> Interactive</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Hover Color</Label>
                      <Input value={formData.hoverBgColor} onChange={e => setFormData({...formData, hoverBgColor: e.target.value})} className="h-10 bg-gray-50 border-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase">Icon Color (Global)</Label>
                      <Input value={formData.iconColor} onChange={e => setFormData({...formData, iconColor: e.target.value})} placeholder="Empty for default" className="h-10 bg-gray-50 border-none" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-8 border-b">
              <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621] flex items-center gap-2">
                <Columns size={18} className="text-primary" /> Dimensions & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Expanded Width (px/rem)</Label>
                    <Input value={formData.expandedWidth} onChange={e => setFormData({...formData, expandedWidth: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Collapsed Width (px/rem)</Label>
                    <Input value={formData.collapsedWidth} onChange={e => setFormData({...formData, collapsedWidth: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Bangla Font Size (px)</Label>
                    <Input value={formData.fontSize} onChange={e => setFormData({...formData, fontSize: e.target.value})} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400">Font Weight</Label>
                    <Select value={formData.fontWeight} onValueChange={v => setFormData({...formData, fontWeight: v})}>
                      <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {['400', '500', '600', '700', '800', '900'].map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* 👁️ PREVIEW SIDEBAR */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[#081621] text-white">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
               <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2"><Eye size={18} className="text-primary"/> Simulation</CardTitle>
               <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2 py-0.5">Real-time</Badge>
            </CardHeader>
            <CardContent className="p-0">
               <div 
                className="w-full min-h-[400px] flex flex-col p-4 gap-2 transition-all duration-500"
                style={{ backgroundColor: formData.bgColor }}
               >
                 <div className="p-4 rounded-2xl flex items-center gap-3 mb-6 border-b border-white/5" style={{ color: formData.textColor }}>
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary font-black">S</div>
                    <span className="text-xs font-black uppercase">Smart Clean</span>
                 </div>

                 {/* Mock Active Item */}
                 <div 
                  className="flex items-center gap-3 p-3 rounded-xl shadow-lg border border-white/5 scale-[1.05]"
                  style={{ backgroundColor: formData.activeBgColor, color: formData.activeTextColor }}
                 >
                    <LayoutDashboard size={18} />
                    <span className="text-[14px] font-bold font-bangla uppercase tracking-tight" style={{ fontSize: formData.fontSize, fontWeight: formData.fontWeight }}>ড্যাশবোর্ড</span>
                 </div>

                 {/* Mock Normal Item */}
                 <div 
                  className="flex items-center gap-3 p-3 rounded-xl opacity-60 mt-2"
                  style={{ color: formData.textColor }}
                 >
                    <Zap size={18} className="text-rose-400" style={formData.iconColor ? { color: formData.iconColor } : {}}/>
                    <span className="text-[14px] font-bold font-bangla uppercase tracking-tight" style={{ fontSize: formData.fontSize, fontWeight: formData.fontWeight }}>সেলস টার্মিনাল</span>
                 </div>

                 {/* Mock Hover Item */}
                 <div 
                  className="flex items-center gap-3 p-3 rounded-xl mt-2 border border-transparent"
                  style={{ backgroundColor: formData.hoverBgColor, color: formData.textColor }}
                 >
                    <ShoppingCart size={18} className="text-blue-400" style={formData.iconColor ? { color: formData.iconColor } : {}}/>
                    <span className="text-[14px] font-bold font-bangla uppercase tracking-tight" style={{ fontSize: formData.fontSize, fontWeight: formData.fontWeight }}>অর্ডার ও বুকিং</span>
                 </div>
               </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
             <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Monitor size={20}/></div>
             <p className="text-[10px] font-medium text-blue-800 leading-relaxed uppercase">
                টিপস: বাংলা টেক্সটের জন্য **Font Weight 700** এবং **Font Size 16px** সবচেয়ে ভালো দেখায়। এই সেটিংটি শুধুমাত্র অ্যাডমিন ড্যাশবোর্ড এবং সাইডবার এর জন্য প্রযোজ্য।
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}

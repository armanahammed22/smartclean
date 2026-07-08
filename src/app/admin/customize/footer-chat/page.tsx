'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Save, 
  Loader2, 
  Zap, 
  Settings2, 
  Eye, 
  MousePointer2, 
  Palette, 
  Type, 
  Smartphone,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Plus,
  X,
  Monitor
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const ICON_LIST = ['MessageCircle', 'MessageSquare', 'HelpCircle', 'Headphones', 'Zap', 'Star', 'Smile', 'Heart', 'Phone', 'Send', 'Activity', 'Award'];

export default function FooterChatManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSubmitting] = useState(false);

  const configRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'footer_live_chat') : null, [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [formData, setFormData] = useState({
    isEnabled: true,
    btnText: 'Live Support',
    description: 'We are online!',
    iconName: 'MessageCircle',
    iconSize: 20,
    iconPosition: 'left',
    btnStyle: 'solid', // solid, outline, soft
    btnSize: 'md', // sm, md, lg
    borderRadius: 24,
    bgColor: '#1E5F7A',
    textColor: '#ffffff',
    borderColor: '#1E5F7A',
    hoverBgColor: '#15435a',
    hoverTextColor: '#ffffff',
    hoverBorderColor: '#15435a',
    showShadow: true,
    animation: 'pulse', // none, pulse, bounce, float
    isFullWidth: false,
    actionType: 'popup', // popup, existing_widget
    desktopVisible: true,
    mobileVisible: true,
    paddingX: 20,
    paddingY: 10,
    marginTop: 0,
    marginBottom: 0
  });

  useEffect(() => {
    if (config) {
      setFormData({ ...formData, ...config });
    }
  }, [config]);

  const handleSave = async () => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'site_settings', 'footer_live_chat'), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "Configuration Published" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const ActiveIcon = (LucideIcons as any)[formData.iconName] || MessageCircle;

  if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary inline" /></div>;

  return (
    <div className="space-y-8 pb-24 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Footer Live Chat</h1>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
            <MessageCircle className="text-primary" size={16}/> Build a high-conversion chat trigger
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Publish Protocol
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-7 space-y-8">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="bg-white border p-1 h-12 rounded-xl w-full shadow-sm flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="content" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Type size={14}/> Content</TabsTrigger>
              <TabsTrigger value="style" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Palette size={14}/> Style</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1 rounded-lg gap-2 text-[10px] font-black uppercase"><Settings2 size={14}/> Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6 mt-0">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                  <CardTitle className="text-base font-black uppercase tracking-widest text-[#081621]">Identity & Text</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase">Enable Component</Label>
                      <p className="text-[9px] font-bold text-primary/60 uppercase">Visible on public pages when enabled</p>
                    </div>
                    <Switch checked={formData.isEnabled} onCheckedChange={v => updateField('isEnabled', v)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Button Title</Label>
                      <Input value={formData.btnText} onChange={e => updateField('btnText', e.target.value)} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Short Description</Label>
                      <Input value={formData.description} onChange={e => updateField('description', e.target.value)} className="h-12 bg-gray-50 border-none rounded-xl font-medium" />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Icon</Label>
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                      {ICON_LIST.map(icon => {
                        const Icon = (LucideIcons as any)[icon];
                        return (
                          <button 
                            key={icon} 
                            type="button"
                            onClick={() => updateField('iconName', icon)}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all flex items-center justify-center",
                              formData.iconName === icon ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-400 hover:border-primary/20"
                            )}
                          >
                            <Icon size={18} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="style" className="space-y-6 mt-0">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                  <CardTitle className="text-base font-black uppercase">Color & Style Matrix</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Background</Label>
                      <Input type="color" value={formData.bgColor} onChange={e => updateField('bgColor', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Text Color</Label>
                      <Input type="color" value={formData.textColor} onChange={e => updateField('textColor', e.target.value)} className="h-10 p-1" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Border Color</Label>
                      <Input type="color" value={formData.borderColor} onChange={e => updateField('borderColor', e.target.value)} className="h-10 p-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Geometry</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Radius (px)</Label>
                          <Input type="number" value={formData.borderRadius} onChange={e => updateField('borderRadius', parseInt(e.target.value))} className="h-10 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Btn Size</Label>
                          <Select value={formData.btnSize} onValueChange={v => updateField('btnSize', v)}>
                            <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue/></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Interaction</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Hover Bg</Label>
                          <Input type="color" value={formData.hoverBgColor} onChange={e => updateField('hoverBgColor', e.target.value)} className="h-10 p-1" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase">Hover Text</Label>
                          <Input type="color" value={formData.hoverTextColor} onChange={e => updateField('hoverTextColor', e.target.value)} className="h-10 p-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase">Animation Protocol</Label>
                        <Select value={formData.animation} onValueChange={v => updateField('animation', v)}>
                          <SelectTrigger className="h-10 bg-gray-50 border-none"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Disabled</SelectItem>
                            <SelectItem value="pulse">Pulse (Glow)</SelectItem>
                            <SelectItem value="bounce">Bounce (Playful)</SelectItem>
                            <SelectItem value="float">Floating (Premium)</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl h-10 mt-6">
                        <Label className="text-[9px] font-black uppercase">Shadow Depth</Label>
                        <Switch checked={formData.showShadow} onCheckedChange={v => updateField('showShadow', v)} />
                     </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-0">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 p-8 border-b">
                  <CardTitle className="text-base font-black uppercase">Visibility & Layout</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Action Type</Label>
                      <Select value={formData.actionType} onValueChange={v => updateField('actionType', v)}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="popup">Open System Support Hub</SelectItem>
                          <SelectItem value="existing_widget">Trigger Existing Chat Widget</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Full Width Mode</Label>
                      <div className="h-12 flex items-center justify-between px-4 bg-gray-50 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-400">Expand to edge</span>
                        <Switch checked={formData.isFullWidth} onCheckedChange={v => updateField('isFullWidth', v)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3 text-gray-400">
                         <Monitor size={18}/>
                         <Label className="text-[10px] font-black uppercase">Desktop Device</Label>
                      </div>
                      <Switch checked={formData.desktopVisible} onCheckedChange={v => updateField('desktopVisible', v)} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3 text-gray-400">
                         <Smartphone size={18}/>
                         <Label className="text-[10px] font-black uppercase">Mobile Device</Label>
                      </div>
                      <Switch checked={formData.mobileVisible} onCheckedChange={v => updateField('mobileVisible', v)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 👁️ PREVIEW SIDEBAR */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <Card className="border-none shadow-2xl bg-[#081621] text-white rounded-[2.5rem] overflow-hidden border border-white/5">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-primary"/>
                <CardTitle className="text-lg font-black uppercase tracking-tight">Real-time Simulation</CardTitle>
              </div>
              <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-3 py-1">WYSIWYG</Badge>
            </CardHeader>
            <CardContent className="p-10 flex flex-col items-center justify-center min-h-[400px] bg-white relative">
               <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
               
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-12">Visual Simulation Area</p>
               
               <div 
                className={cn(
                  "flex items-center gap-3 transition-all duration-300",
                  formData.isFullWidth ? "w-full" : "w-fit",
                  formData.animation === 'pulse' && "animate-pulse",
                  formData.animation === 'bounce' && "animate-bounce",
                  formData.animation === 'float' && "animate-float"
                )}
                style={{ 
                  backgroundColor: formData.bgColor,
                  color: formData.textColor,
                  border: `1px solid ${formData.borderColor}`,
                  borderRadius: `${formData.borderRadius}px`,
                  padding: `${formData.paddingY}px ${formData.paddingX}px`,
                  boxShadow: formData.showShadow ? '0 10px 30px rgba(0,0,0,0.2)' : 'none'
                }}
               >
                 <ActiveIcon size={formData.iconSize} style={{ order: formData.iconPosition === 'left' ? 0 : 2 }} />
                 <div className="flex flex-col text-left" style={{ order: 1 }}>
                   <span className="text-xs font-black uppercase tracking-tight leading-none">{formData.btnText}</span>
                   {formData.description && <span className="text-[7px] md:text-[9px] font-bold opacity-70 uppercase tracking-widest mt-0.5 whitespace-nowrap">{formData.description}</span>}
                 </div>
               </div>

               <div className="mt-16 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 max-w-[280px]">
                  <div className="flex items-center gap-2 mb-2">
                     <Info size={14} className="text-blue-600"/>
                     <span className="text-[9px] font-black uppercase text-gray-400">Behavior Note</span>
                  </div>
                  <p className="text-[10px] font-medium text-gray-600 leading-relaxed uppercase">
                    এই বাটনটি ওয়েবসাইটের ফুটারে ফিক্সড থাকবে। এটি ইউজারকে সাপোর্ট নিতে উৎসাহিত করে।
                  </p>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

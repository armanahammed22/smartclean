
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Layout, 
  CheckCircle2, 
  Plus,
  RefreshCw,
  Eye,
  Zap,
  MousePointer2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function MarketingPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  const heroGridImages = PlaceHolderImages.filter(img => img.id.startsWith('hero-grid-'));

  const handleSimulateUpload = (id: string) => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Image Uploaded",
        description: `Banner slot updated successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Banners</h1>
          <p className="text-muted-foreground text-sm">Customize the website hero section and promotional banners</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold h-11">
              <Eye size={16} /> Preview Site
           </Button>
           <Button className="gap-2 font-bold h-11 shadow-lg">
              <RefreshCw size={16} /> Sync Changes
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b">
                 <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Layout size={18} className="text-primary" />
                    Hero Section Image Grid
                 </CardTitle>
                 <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Manage Slot imagery for the homepage carousel</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {heroGridImages.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border bg-gray-50 aspect-square shadow-sm">
                        <Image 
                          src={img.imageUrl} 
                          alt={img.description} 
                          fill 
                          className="object-cover transition-opacity group-hover:opacity-40" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/60">
                           <div className="flex gap-2">
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-8 w-8 rounded-full shadow-lg"
                                onClick={() => handleSimulateUpload(img.id)}
                              >
                                <Upload size={14} />
                              </Button>
                              <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-lg">
                                <Trash2 size={14} />
                              </Button>
                           </div>
                           <span className="text-[8px] text-white font-black mt-2 uppercase tracking-widest">Slot {img.id.split('-').pop()}</span>
                        </div>
                      </div>
                    ))}
                    <button className="border-2 border-dashed border-gray-200 rounded-xl aspect-square flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-all bg-white hover:bg-primary/5">
                       <Plus size={24} />
                       <span className="text-[9px] font-black uppercase">Add Slot</span>
                    </button>
                 </div>
              </CardContent>
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                 <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><CheckCircle2 size={24} /></div>
                    <div className="space-y-1">
                       <p className="font-bold text-sm">Lead Welcome</p>
                       <p className="text-[10px] text-muted-foreground uppercase font-black">Active Automation</p>
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-none font-bold text-[9px]">ON</Badge>
                 </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-white rounded-2xl">
                 <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><MousePointer2 size={24} /></div>
                    <div className="space-y-1">
                       <p className="font-bold text-sm">Cart Recovery</p>
                       <p className="text-[10px] text-muted-foreground uppercase font-black">SMS Sequence</p>
                    </div>
                    <Badge className="bg-gray-100 text-gray-500 border-none font-bold text-[9px]">PAUSED</Badge>
                 </CardContent>
              </Card>
           </div>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-sm bg-white rounded-2xl h-fit">
              <CardHeader>
                 <CardTitle className="text-lg font-bold">Hero Text Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Bengali Headline</Label>
                    <Input defaultValue="আপনি কি ক্লিনিং সার্ভিস নিতে চাচ্ছেন?" className="bg-gray-50 border-gray-100" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Bengali Sub-Headline</Label>
                    <Input defaultValue="Smart Clean নিয়ে এলো সম্পূর্ণ প্রফেশনাল ক্লিনিং সার্ভিস" className="bg-gray-50 border-gray-100" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Booking Phone</Label>
                    <Input defaultValue="01919640422" className="bg-gray-50 border-gray-100" />
                 </div>
                 <Button className="w-full font-bold h-11 shadow-lg mt-2">Update Banner Text</Button>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6 relative">
                 <ImageIcon size={40} className="opacity-20 absolute -top-2 -right-2" />
                 <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight">AI Optimization</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                       Our AI automatically resizes and compresses your hero images for 98/100 mobile performance scores.
                    </p>
                 </div>
                 <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span>Speed Score</span>
                       <span>98%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white w-[98%] shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

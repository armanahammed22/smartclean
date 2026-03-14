
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
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function MarketingPage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  
  // Filtering for hero grid images
  const heroGridImages = PlaceHolderImages.filter(img => img.id.startsWith('hero-grid-'));

  const handleSimulateUpload = (id: string) => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({
        title: "Image Uploaded",
        description: `Banner image ${id.split('-').pop()} has been updated successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing & Banner Management</h1>
          <p className="text-muted-foreground text-sm">Customize the website hero section and promotional banners</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2 font-bold">
              <Eye size={16} /> Preview Site
           </Button>
           <Button className="gap-2 font-bold">
              <RefreshCw size={16} /> Sync Changes
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Banner Grid Control */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-sm">
              <CardHeader>
                 <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Layout size={18} className="text-primary" />
                    Hero Section Image Grid
                 </CardTitle>
                 <CardDescription>Upload up to 6 images for the main homepage banner grid.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {heroGridImages.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border bg-gray-50 aspect-square">
                        <Image 
                          src={img.imageUrl} 
                          alt={img.description} 
                          fill 
                          className="object-cover transition-opacity group-hover:opacity-40" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/40">
                           <div className="flex gap-2">
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleSimulateUpload(img.id)}
                              >
                                <Upload size={14} />
                              </Button>
                              <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full">
                                <Trash2 size={14} />
                              </Button>
                           </div>
                           <span className="text-[10px] text-white font-bold mt-2 uppercase tracking-widest">Replace Slot {img.id.split('-').pop()}</span>
                        </div>
                      </div>
                    ))}
                    <button className="border-2 border-dashed border-gray-200 rounded-xl aspect-square flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors bg-white">
                       <Plus size={24} />
                       <span className="text-[10px] font-bold uppercase">Add Slot</span>
                    </button>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm">
              <CardHeader>
                 <CardTitle className="text-lg font-bold">Campaign Automation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle2 size={24} /></div>
                       <div>
                          <p className="font-bold text-sm">Lead Welcome Email</p>
                          <p className="text-xs text-muted-foreground">Sent automatically to new CRM leads</p>
                       </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">ACTIVE</Badge>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><CheckCircle2 size={24} /></div>
                       <div>
                          <p className="font-bold text-sm">Abandoned Booking SMS</p>
                          <p className="text-xs text-muted-foreground">Follow up after 10 mins of cart inactivity</p>
                       </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">PAUSED</Badge>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
           <Card className="border-none shadow-sm">
              <CardHeader>
                 <CardTitle className="text-lg font-bold">Hero Text Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Bengali Headline</Label>
                    <Input defaultValue="আপনি কি ক্লিনিং সার্ভিস নিতে চাচ্ছেন?" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Bengali Sub-Headline</Label>
                    <Input defaultValue="Smart Clean নিয়ে এলো সম্পূর্ণ প্রফেশনাল ক্লিনিং সার্ভিস" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Booking Phone</Label>
                    <Input defaultValue="01919640422" />
                 </div>
                 <Button className="w-full font-bold h-11">Update Banner Text</Button>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-primary text-white">
              <CardContent className="p-6 space-y-4">
                 <ImageIcon size={32} className="opacity-20" />
                 <h3 className="text-xl font-bold">Banner Optimization</h3>
                 <p className="text-sm opacity-80 leading-relaxed">
                    Our AI automatically resizes and compresses your hero images for lightning-fast mobile performance in Bangladesh.
                 </p>
                 <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1"><span>Current Speed Score</span><span>98/100</span></div>
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-white w-[98%]" />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

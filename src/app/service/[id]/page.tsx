"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  CalendarCheck, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Loader2, 
  Zap,
  Star,
  CheckCircle2,
  Calendar as CalendarIcon,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useCart } from '@/components/providers/cart-provider';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layout/public-layout';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, setCheckoutOpen } = useCart();
  const db = useFirestore();

  // Booking States
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [address, setAddress] = useState("");
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

  // Fetch Service Data
  const serviceRef = useMemoFirebase(() => db ? doc(db, 'services', id as string) : null, [db, id]);
  const { data: service, isLoading: serviceLoading } = useDoc(serviceRef);

  // Fetch Linked Sub-Services
  const subServicesQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'sub_services'), where('mainServiceId', '==', id), where('status', '==', 'Active'));
  }, [db, id]);
  const { data: subServices, isLoading: subLoading } = useCollection(subServicesQuery);

  // Calculate Totals
  const totalPrice = useMemo(() => {
    if (!service) return 0;
    const subsPrice = subServices
      ?.filter(s => selectedSubIds.includes(s.id))
      .reduce((acc, s) => acc + (Number(s.price) || 0), 0) || 0;
    return (service.basePrice || 0) + subsPrice;
  }, [service, subServices, selectedSubIds]);

  const handleBookNow = () => {
    if (!service) return;
    const selectedSubs = subServices?.filter(s => selectedSubIds.includes(s.id)) || [];
    const combinedTitle = selectedSubs.length > 0 
      ? `${service.title} (${selectedSubs.map(s => s.name).join(', ')})`
      : service.title;

    addToCart({
      ...service,
      title: combinedTitle,
      basePrice: totalPrice,
    } as any);
    setCheckoutOpen(true);
  };

  if (serviceLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!service) return <div className="p-20 text-center font-bold text-muted-foreground">Service Not Found</div>;

  return (
    <PublicLayout>
      {/* Increased bottom padding on mobile to account for both bars */}
      <div className="bg-[#F8FAFC] min-h-screen pb-40 lg:pb-20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 rounded-full hover:bg-white shadow-sm transition-all">
            <ArrowLeft size={18} /> {t('back_to_list')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Image & Details */}
            <div className="lg:col-span-8 space-y-8">
              <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-gray-200 border-4 border-white">
                <Image 
                  src={service.imageUrl || 'https://picsum.photos/seed/srv/1200/800'} 
                  alt={service.title} 
                  fill 
                  className="object-cover" 
                  priority
                />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-primary text-white border-none px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">
                    {service.categoryId || 'Premium Service'}
                  </Badge>
                </div>
              </div>

              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-tight">{service.title}</h1>
                    <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={18} fill="currentColor" /> 4.9 (250+ Bookings)
                      </div>
                      <span className="opacity-20">|</span>
                      <div className="flex items-center gap-1.5"><Clock size={18} className="text-primary" /> {service.duration || '2-4 Hours'}</div>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 font-medium leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Additional Services (Sub Services) */}
                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap size={20} fill="currentColor" /></div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Additional Services</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {subLoading ? (
                      <div className="py-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                    ) : subServices?.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={cn(
                          "flex items-center justify-between p-6 rounded-3xl border-2 transition-all cursor-pointer bg-white group",
                          selectedSubIds.includes(sub.id) ? "border-primary bg-primary/5 shadow-inner" : "border-gray-100 hover:border-gray-200 shadow-sm"
                        )}
                        onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                      >
                        <div className="flex items-center gap-5">
                          <Checkbox 
                            checked={selectedSubIds.includes(sub.id)} 
                            className="h-7 w-7 rounded-xl data-[state=checked]:bg-primary border-gray-300 transition-all"
                          />
                          <div>
                            <p className="font-black text-gray-900 text-lg group-hover:text-primary transition-colors">{sub.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                              <Clock size={10} /> {sub.duration}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-xl text-primary tracking-tighter">৳{sub.price.toLocaleString()}</span>
                      </div>
                    ))}
                    {!subServices?.length && !subLoading && (
                      <div className="p-12 text-center text-muted-foreground italic bg-gray-50/50 rounded-[2rem] border-2 border-dashed">
                        No additional tasks available for this service.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <Card className="rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none overflow-hidden sticky top-24">
                <CardHeader className="bg-[#081621] text-white p-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black uppercase tracking-widest text-primary">Booking Panel</CardTitle>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Smart Clean Bangladesh</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md"><CalendarCheck size={24} className="text-primary" /></div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Preferred Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-14 justify-start gap-3 font-bold rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/30 transition-all text-sm">
                            <CalendarIcon size={18} className="text-primary" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select Service Date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="end">
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date()} className="p-4" />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Time Window</Label>
                      <Select onValueChange={setSelectedTime} value={selectedTime}>
                        <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 font-bold text-sm focus:ring-primary/20">
                          <SelectValue placeholder="Choose a Time Slot" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="morning" className="font-bold">Morning (8am-12pm)</SelectItem>
                          <SelectItem value="afternoon" className="font-bold">Afternoon (12pm-4pm)</SelectItem>
                          <SelectItem value="evening" className="font-bold">Evening (4pm-8pm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Service Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                        <Input 
                          placeholder="House, Street, Sector..." 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50/50 font-medium text-sm focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-bold uppercase tracking-tight text-xs">Starting Base</span>
                        <span className="font-black text-gray-900">৳{service.basePrice.toLocaleString()}</span>
                      </div>
                      {selectedSubIds.length > 0 && (
                        <div className="flex justify-between items-center text-sm animate-in fade-in slide-in-from-top-1">
                          <span className="text-muted-foreground font-bold uppercase tracking-tight text-xs">Add-ons ({selectedSubIds.length})</span>
                          <span className="font-black text-gray-900">+৳{(totalPrice - service.basePrice).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-end bg-primary/5 p-5 rounded-3xl border border-primary/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total Investment</span>
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-none font-black text-[8px] px-3 py-1 rounded-full mb-1">VAT INCLUDED</Badge>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookNow} 
                    className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-primary/30 uppercase tracking-tight gap-3 hover:scale-[1.02] transition-transform"
                  >
                    Confirm Booking <Zap size={22} fill="currentColor" />
                  </Button>

                  <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[1.5rem] text-[10px] text-muted-foreground font-bold uppercase leading-relaxed border border-gray-100">
                    <ShieldCheck size={28} className="text-primary shrink-0" />
                    <span>Secure Booking with Professional Verified Staff Guarantee</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar - Adjusted to sit above the bottom nav (bottom-16) */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 px-6 py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500 rounded-t-[2rem]">
          <div className="container mx-auto flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Total Price</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#081621] tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                <span className="text-[8px] font-black text-muted-foreground uppercase">est.</span>
              </div>
            </div>
            <Button 
              onClick={handleBookNow} 
              className="h-16 px-10 rounded-2xl font-black text-base uppercase shadow-xl shadow-primary/30 gap-3 flex-1 max-w-[220px]"
            >
              {t('book_now')} <Zap size={20} fill="currentColor" />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

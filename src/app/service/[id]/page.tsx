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
  Info,
  ChevronRight,
  Star,
  CheckCircle2,
  Calendar as CalendarIcon,
  ShoppingCart
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
      <div className="bg-[#F8FAFC] min-h-screen pb-24 lg:pb-20">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 rounded-full hover:bg-white shadow-sm">
            <ArrowLeft size={18} /> {t('back_to_list')}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Media & Details */}
            <div className="lg:col-span-8 space-y-8">
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl bg-gray-200 border-4 border-white">
                <Image 
                  src={service.imageUrl || 'https://picsum.photos/seed/srv/1200/800'} 
                  alt={service.title} 
                  fill 
                  className="object-cover" 
                  priority
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                    {service.categoryId || 'Professional Service'}
                  </Badge>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">{service.title}</h1>
                  <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={16} fill="currentColor" /> 4.9 (120+ Reviews)
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1"><Clock size={16} /> {service.duration || '2-3 Hours'}</div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-gray-600 font-medium leading-relaxed">
                  {service.description}
                </div>
              </div>

              {/* Additional Services (Sub Services) */}
              <div className="space-y-4">
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 px-2">Additional Services</h3>
                <div className="grid grid-cols-1 gap-3">
                  {subLoading ? (
                    <div className="py-10 text-center"><Loader2 className="animate-spin inline text-primary" /></div>
                  ) : subServices?.map((sub) => (
                    <div 
                      key={sub.id} 
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white group",
                        selectedSubIds.includes(sub.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-gray-200 shadow-sm"
                      )}
                      onClick={() => setSelectedSubIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox 
                          checked={selectedSubIds.includes(sub.id)} 
                          className="h-6 w-6 rounded-md data-[state=checked]:bg-primary border-gray-300"
                        />
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{sub.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{sub.duration}</p>
                        </div>
                      </div>
                      <span className="font-black text-primary">৳{sub.price.toLocaleString()}</span>
                    </div>
                  ))}
                  {!subServices?.length && !subLoading && (
                    <div className="p-8 text-center text-muted-foreground italic bg-white rounded-2xl border-2 border-dashed">
                      No additional tasks available for this service.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Sticky Booking Panel (Desktop) */}
            <div className="lg:col-span-4 hidden lg:block">
              <Card className="rounded-3xl shadow-2xl border-none overflow-hidden sticky top-24">
                <CardHeader className="bg-[#081621] text-white p-6 md:p-8">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-black uppercase tracking-widest text-primary">Booking Details</CardTitle>
                    <div className="p-2 bg-white/10 rounded-xl"><CalendarCheck size={20} className="text-primary" /></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full h-12 justify-start gap-2 font-bold rounded-xl border-gray-200">
                            <CalendarIcon size={16} className="text-primary" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl" align="end">
                          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(d) => d < new Date()} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Preferred Time</Label>
                      <Select onValueChange={setSelectedTime} value={selectedTime}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold">
                          <SelectValue placeholder="Select Slot" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12pm-4pm)</SelectItem>
                          <SelectItem value="evening">Evening (4pm-8pm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Address</Label>
                      <Input 
                        placeholder="House, Street, Area..." 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-12 rounded-xl border-gray-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-bold uppercase tracking-tighter">Base Price</span>
                      <span className="font-black">৳{service.basePrice.toLocaleString()}</span>
                    </div>
                    {selectedSubIds.length > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-bold uppercase tracking-tighter">Add-ons ({selectedSubIds.length})</span>
                        <span className="font-black">৳{(totalPrice - service.basePrice).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total Price</span>
                        <span className="text-3xl font-black text-gray-900 tracking-tighter">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-none font-black text-[9px] px-3 mb-1">VAT INCLUDED</Badge>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBookNow} 
                    className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 uppercase tracking-tight gap-2"
                  >
                    Confirm Booking <Zap size={20} fill="currentColor" />
                  </Button>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
                    <ShieldCheck size={24} className="text-primary shrink-0" />
                    <span>Secure Booking with Professional Staff Guarantee</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Booking Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 px-4 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-full duration-300">
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total Price</span>
              <span className="text-2xl font-black text-[#081621] tracking-tighter leading-none">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button 
              onClick={handleBookNow} 
              className="h-14 px-8 rounded-2xl font-black text-base uppercase shadow-lg shadow-primary/30 gap-2 flex-1 max-w-[200px]"
            >
              {t('book_now')} <Zap size={18} fill="currentColor" />
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

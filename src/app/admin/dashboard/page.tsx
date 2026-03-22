
'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, doc, writeBatch, query, orderBy } from 'firebase/firestore';
import { 
  Users, 
  Database,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Package,
  Wrench,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const CHART_DATA = [
  { name: 'Mon', val: 45 },
  { name: 'Tue', val: 52 },
  { name: 'Wed', val: 48 },
  { name: 'Thu', val: 61 },
  { name: 'Fri', val: 55 },
  { name: 'Sat', val: 67 },
  { name: 'Sun', val: 70 },
];

const BOOTSTRAP_ADMIN_UID = '6YTKdslETkVXcftvhSY5x9sjOgT2';

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || user?.uid === BOOTSTRAP_ADMIN_UID;

  const ordersQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'orders') : null, [db, isAuthorized]);
  const bookingsQuery = useMemoFirebase(() => (db && isAuthorized) ? collection(db, 'bookings') : null, [db, isAuthorized]);
  
  const { data: orders } = useCollection(ordersQuery);
  const { data: bookings } = useCollection(bookingsQuery);

  const handleSeedData = async () => {
    if (!db || !isAuthorized) return;
    setIsSeeding(true);
    
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // 1. SEED SITE SETTINGS
      const settingsRef = doc(db, 'site_settings', 'global');
      batch.set(settingsRef, {
        websiteName: 'Smart Clean',
        contactEmail: 'support@smartclean.com',
        contactPhone: '+8801919640422',
        address: 'Wireless Gate, Mohakhali, Dhaka-1212',
        footerContent: '© 2026 Smart Clean Bangladesh. All rights reserved.',
        seoTitle: 'Smart Clean | Professional Cleaning in Bangladesh',
        seoDescription: 'Expert cleaning and maintenance services for your home and office.',
        updatedAt: now
      }, { merge: true });

      // 2. SEED CATEGORIES (Daraz Style)
      const CATEGORY_MAP = [
        {
          name: "Home & Living",
          subs: [
            { name: "Cleaning", children: ["Vacuum Cleaners", "Mops & Sweepers", "Cleaning Agents"] },
            { name: "Furniture", children: ["Living Room", "Bedroom", "Office"] }
          ]
        },
        {
          name: "Services",
          subs: [
            { name: "Cleaning", children: ["Deep Cleaning", "Sofa Cleaning", "Carpet Cleaning"] },
            { name: "Repair", children: ["AC Repair", "Fridge Repair", "Plumbing"] }
          ]
        }
      ];

      CATEGORY_MAP.forEach((mainCat, mainIdx) => {
        const catRef = doc(collection(db, 'categories'));
        const catId = catRef.id;
        batch.set(catRef, {
          name: mainCat.name,
          slug: mainCat.name.toLowerCase().replace(/\s+/g, '-'),
          order: mainIdx,
          createdAt: now
        });

        mainCat.subs.forEach((sub, subIdx) => {
          const subRef = doc(collection(db, 'subcategories'));
          const subId = subRef.id;
          batch.set(subRef, {
            name: sub.name,
            slug: sub.name.toLowerCase().replace(/\s+/g, '-'),
            categoryId: catId,
            order: subIdx,
            createdAt: now
          });

          sub.children.forEach((child, childIdx) => {
            const childRef = doc(collection(db, 'childcategories'));
            batch.set(childRef, {
              name: child,
              slug: child.toLowerCase().replace(/\s+/g, '-'),
              subcategoryId: subId,
              order: childIdx,
              createdAt: now
            });
          });
        });
      });

      // 3. SEED SAMPLE SERVICES
      const SAMPLE_SERVICES = [
        { title: "Home Deep Cleaning", basePrice: 5000, categoryId: "Cleaning", duration: "4-6 Hours", imageUrl: "https://picsum.photos/seed/hservice/800/600" },
        { title: "AC Master Service", basePrice: 2500, categoryId: "Repair", duration: "1-2 Hours", imageUrl: "https://picsum.photos/seed/acserv/800/600" },
        { title: "Sofa Shampooing", basePrice: 1500, categoryId: "Cleaning", duration: "2 Hours", imageUrl: "https://picsum.photos/seed/sofaserv/800/600" }
      ];

      SAMPLE_SERVICES.forEach(s => {
        const sRef = doc(collection(db, 'services'));
        batch.set(sRef, {
          ...s,
          status: 'Active',
          description: `Professional ${s.title} provided by certified technicians. Includes all necessary materials and tools.`,
          shortDescription: `Top-rated ${s.title} for your home.`,
          createdAt: now
        });
      });

      // 4. SEED SAMPLE PRODUCTS
      const SAMPLE_PRODUCTS = [
        { name: "Smart Vacuum Robot V2", price: 35000, regularPrice: 42000, stockQuantity: 15, categoryId: "Cleaning", brand: "Xiaomi", imageUrl: "https://picsum.photos/seed/robotv/600/600" },
        { name: "Industrial Steam Mop", price: 8500, regularPrice: 9500, stockQuantity: 20, categoryId: "Tools", brand: "Karcher", imageUrl: "https://picsum.photos/seed/mopv/600/600" },
        { name: "Organic Multi-Surface Cleaner", price: 450, regularPrice: 550, stockQuantity: 100, categoryId: "Cleaning", brand: "EcoClean", imageUrl: "https://picsum.photos/seed/sprayv/600/600" }
      ];

      SAMPLE_PRODUCTS.forEach(p => {
        const pRef = doc(collection(db, 'products'));
        batch.set(pRef, {
          ...p,
          status: 'Active',
          isPopular: true,
          description: `High-quality ${p.name} designed for professional efficiency. Safe for all home environments.`,
          shortDescription: `Premium ${p.name} for expert results.`,
          createdAt: now
        });
      });

      // 5. SEED SAMPLE BANNERS
      const BANNER_REF = doc(collection(db, 'hero_banners'));
      batch.set(BANNER_REF, {
        title: "Spring Cleaning Sale",
        subtitle: "Get up to 40% off on all deep cleaning services this month!",
        imageUrl: "https://picsum.photos/seed/hero1/1200/400",
        isActive: true,
        type: 'main',
        order: 0,
        buttonText: "Book Now",
        buttonLink: "/services",
        buttonColor: "#22c55e",
        createdAt: now
      });

      // 6. SEED DELIVERY OPTIONS
      const DELIVERY_DATA = [
        { label: "Inside Dhaka", amount: 60, isEnabled: true },
        { label: "Outside Dhaka", amount: 120, isEnabled: true }
      ];
      DELIVERY_DATA.forEach(d => {
        const dRef = doc(collection(db, 'delivery_options'));
        batch.set(dRef, { ...d, createdAt: now });
      });

      // 7. SEED HOMEPAGE SECTIONS
      const SECTION_DATA = [
        { title: 'Flash Sale', type: 'FlashSale', order: 1, isActive: true },
        { title: 'Just For You', type: 'Products', order: 2, isActive: true },
        { title: 'Essential Services', type: 'Services', order: 3, isActive: true }
      ];
      SECTION_DATA.forEach(s => {
        const sRef = doc(collection(db, 'homepage_sections'));
        batch.set(sRef, { ...s, createdAt: now });
      });

      await batch.commit();
      toast({ title: "ERP Ecosystem Seeded", description: "Sample products, services, banners, and settings are now live." });
    } catch (err) {
      console.error("Seeding failed:", err);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Operations Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time control over marketplace transactions</p>
        </div>
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold rounded-xl shadow-sm border-primary/20 text-primary">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP Ecosystem
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: "Service Bookings", value: bookings?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Product Orders", value: orders?.length || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Revenue (Est)", value: "৳0", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Active Staff", value: "8", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className={cn("p-2.5 w-fit rounded-xl", stat.bg, stat.color)}><stat.icon size={20} /></div>
                <div className="space-y-1">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                  <h3 className="text-lg md:text-2xl font-black text-gray-900">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Volume Trends</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] rounded-full px-3">Live</Badge>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="val" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-[2rem]">
          <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
          <CardHeader><CardTitle className="text-lg font-bold relative z-10">Operations</CardTitle></CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Pending Shipments", val: orders?.filter(o => o.status === 'New').length || 0, icon: Package },
                  { label: "Pending Bookings", val: bookings?.filter(b => b.status === 'New').length || 0, icon: Calendar }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase opacity-60 leading-none">{kpi.label}</p>
                      <span className="text-2xl font-black">{kpi.val}</span>
                    </div>
                    <kpi.icon size={24} className="opacity-40" />
                  </div>
                ))}
             </div>
             <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-black h-12 mt-4 rounded-2xl uppercase tracking-tighter" asChild>
               <Link href="/admin/orders">Go to Dispatch Center</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

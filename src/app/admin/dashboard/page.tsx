
'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch, getDocs } from 'firebase/firestore';
import { 
  Users, 
  Database,
  Loader2,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Package,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

const CHART_DATA = [
  { name: 'Jan', leads: 45, conversion: 12 },
  { name: 'Feb', leads: 52, conversion: 15 },
  { name: 'Mar', leads: 48, conversion: 10 },
  { name: 'Apr', leads: 61, conversion: 18 },
  { name: 'May', leads: 55, conversion: 14 },
  { name: 'Jun', leads: 67, conversion: 22 },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  // Authorization Check
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admins', user.uid);
  }, [db, user]);
  const { data: adminRole, isLoading: roleLoading } = useDoc(adminRoleRef);
  
  const isAuthorized = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

  // Resilient Queries
  const ordersQuery = useMemoFirebase(() => (db && user && isAuthorized) ? collection(db, 'orders') : null, [db, user, isAuthorized]);
  const bookingsQuery = useMemoFirebase(() => (db && user && isAuthorized) ? collection(db, 'bookings') : null, [db, user, isAuthorized]);
  const employeesQuery = useMemoFirebase(() => (db && user && isAuthorized) ? collection(db, 'employee_profiles') : null, [db, user, isAuthorized]);
  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? collection(db, 'services') : null, [db]);

  const { data: orders } = useCollection(ordersQuery);
  const { data: bookings } = useCollection(bookingsQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  const handleSeedData = async () => {
    if (!db || !user || !isAuthorized) return;
    setIsSeeding(true);
    
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      // 1. Global Settings
      batch.set(doc(db, 'site_settings', 'global'), {
        websiteName: 'Smart Clean',
        logoUrl: 'https://picsum.photos/seed/smartclean-logo/200/200',
        contactEmail: 'smartclean422@gmail.com',
        contactPhone: '+8801919640422',
        address: 'Wireless Gate, Mohakhali, Dhaka-1212',
        currency: 'BDT',
        defaultLanguage: 'bn',
        otpEnabled: false,
        seoTitle: 'Smart Clean | Professional Cleaning in Bangladesh',
        seoDescription: 'Expert cleaning services for home and office.',
        updatedAt: now
      }, { merge: true });

      // 2. Comprehensive 3-Level Category Structure
      const CATEGORY_MAP = [
        {
          name: "Women's Fashion",
          subs: [
            { name: "Clothing", children: ["Sarees", "Kurtas & Shalwar Kameez", "Western Wear", "Lingerie & Sleepwear"] },
            { name: "Shoes", children: ["Heels", "Sneakers", "Flats", "Boots"] },
            { name: "Bags", children: ["Shoulder Bags", "Backpacks", "Wallets"] }
          ]
        },
        {
          name: "Electronics",
          subs: [
            { name: "Mobile", children: ["Smart Phones", "Feature Phones", "Refurbished Phones"] },
            { name: "Laptops", children: ["Gaming Laptops", "Macbooks", "Ultrabooks", "Chromebooks"] },
            { name: "Audio", children: ["Headphones", "TWS Earbuds", "Bluetooth Speakers"] }
          ]
        },
        {
          name: "Health & Beauty",
          subs: [
            { name: "Skincare", children: ["Face Wash", "Moisturizer", "Sunscreen", "Serum"] },
            { name: "Hair Care", children: ["Shampoo", "Conditioner", "Hair Oil"] },
            { name: "Fragrances", children: ["Perfume", "Deodorant", "Body Mist"] }
          ]
        },
        {
          name: "Home & Living",
          subs: [
            { name: "Cleaning", children: ["Vacuum Cleaners", "Mops & Sweepers", "Laundry", "Cleaning Agents"] },
            { name: "Kitchen", children: ["Cookware", "Kitchen Appliances", "Bakeware"] },
            { name: "Furniture", children: ["Living Room", "Bedroom", "Office Furniture"] }
          ]
        }
      ];

      CATEGORY_MAP.forEach((mainCat, mainIdx) => {
        const catRef = doc(collection(db, 'categories'));
        const catId = catRef.id;
        batch.set(catRef, {
          name: mainCat.name,
          slug: mainCat.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          order: mainIdx,
          imageUrl: `https://picsum.photos/seed/cat${mainIdx}/200/200`,
          createdAt: now
        });

        mainCat.subs.forEach((sub, subIdx) => {
          const subRef = doc(collection(db, 'subcategories'));
          const subId = subRef.id;
          batch.set(subRef, {
            name: sub.name,
            slug: sub.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            categoryId: catId,
            order: subIdx,
            createdAt: now
          });

          sub.children.forEach((child, childIdx) => {
            const childRef = doc(collection(db, 'childcategories'));
            batch.set(childRef, {
              name: child,
              slug: child.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              subcategoryId: subId,
              order: childIdx,
              createdAt: now
            });
          });
        });
      });

      // 3. Homepage Nav Categories (Circular Grid)
      const NAV_MAP = [
        { name: 'Cleaning', icon: 'Wrench', link: '/services?category=Cleaning', order: 1 },
        { name: 'Fashion', icon: 'LayoutGrid', link: '/products?category=Fashion', order: 2 },
        { name: 'Electronics', icon: 'Zap', link: '/products?category=Electronics', order: 3 },
        { name: 'Beauty', icon: 'Sparkles', link: '/products?category=Beauty', order: 4 },
        { name: 'Grocery', icon: 'ShoppingCart', link: '/products?category=Grocery', order: 5 },
        { name: 'Tools', icon: 'Package', link: '/products?category=Tools', order: 6 },
        { name: 'Offers', icon: 'Flashlight', link: '/campaigns', order: 7 },
        { name: 'Help', icon: 'Timer', link: '/support', order: 8 }
      ];

      NAV_MAP.forEach(nav => {
        const ref = doc(collection(db, 'top_nav_categories'));
        batch.set(ref, { ...nav, createdAt: now });
      });

      await batch.commit();
      toast({ title: "Full Taxonomy Seeded", description: "3-level categories and nav shortcuts are now live." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  if (roleLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  const STATS = [
    { title: "Service Bookings", value: bookings?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", trend: "+15%", isUp: true },
    { title: "Staff Count", value: employees?.length || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50", trend: "+2%", isUp: true },
    { title: "Active Services", value: services?.filter(s => s.status === 'Active').length || 0, icon: Wrench, color: "text-blue-600", bg: "bg-blue-50", trend: "+5%", isUp: true },
    { title: "Product Orders", value: orders?.length || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12%", isUp: true },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Operations Hub</h1>
          <p className="text-muted-foreground text-sm">Real-time control over bookings, staff, and inventory</p>
        </div>
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold rounded-xl shadow-sm">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP Data
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}><stat.icon size={20} /></div>
                  <div className={cn("flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full", stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {stat.trend}
                  </div>
                </div>
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
            <CardTitle className="text-lg font-bold">Booking Trends</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary border-none uppercase font-black text-[9px] rounded-full px-3">Live Data</Badge>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="leads" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-[2rem]">
          <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
          <CardHeader><CardTitle className="text-lg font-bold relative z-10">Operations Matrix</CardTitle></CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Products", val: products?.length || 0, icon: Package },
                  { label: "Services", val: services?.length || 0, icon: Wrench },
                  { label: "Staff", val: employees?.length || 0, icon: Users }
                ].map((kpi, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">{kpi.label}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black">{kpi.val}</span>
                      <kpi.icon size={14} className="opacity-40" />
                    </div>
                  </div>
                ))}
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-12 mt-4 shadow-xl rounded-2xl uppercase tracking-tighter">
               Performance Log
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

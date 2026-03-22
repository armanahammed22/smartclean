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

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const adminRoleRef = useMemoFirebase(() => (db && user) ? doc(db, 'roles_admins', user.uid) : null, [db, user]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAuthorized = !!adminRole || user?.uid === 'gcp03WmpjROVvRdpLNsghNU4zHa2';

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

      const CATEGORY_MAP = [
        {
          name: "Women's Fashion",
          subs: [
            { name: "Clothing", children: ["Sarees", "Kurtas & Shalwar Kameez", "Western Wear", "Lingerie & Sleepwear"] },
            { name: "Shoes", children: ["Heels", "Sneakers", "Flats", "Boots"] },
            { name: "Accessories", children: ["Shoulder Bags", "Wallets", "Jewellery"] }
          ]
        },
        {
          name: "Men's Fashion",
          subs: [
            { name: "Clothing", children: ["T-Shirts", "Shirts", "Panjabis", "Jeans", "Suits"] },
            { name: "Shoes", children: ["Formal Shoes", "Sneakers", "Sandals"] },
            { name: "Accessories", children: ["Belts", "Wallets", "Eyewear"] }
          ]
        },
        {
          name: "Kids & Baby",
          subs: [
            { name: "Feeding", children: ["Milk Formula", "Baby Food", "Bottles", "Breastfeeding"] },
            { name: "Diapering", children: ["Diapers", "Wipes", "Diaper Bags"] },
            { name: "Baby Gear", children: ["Strollers", "Walkers", "Car Seats"] }
          ]
        },
        {
          name: "Electronics",
          subs: [
            { name: "Mobile Phones", children: ["Android Phones", "iPhones", "Feature Phones"] },
            { name: "Laptops", children: ["Gaming Laptops", "Macbooks", "Ultrabooks", "Chromebooks"] },
            { name: "Audio", children: ["Headphones", "TWS Earbuds", "Bluetooth Speakers"] }
          ]
        },
        {
          name: "TV & Home Appliances",
          subs: [
            { name: "Televisions", children: ["Smart TVs", "LED TVs", "OLED TVs"] },
            { name: "Large Appliances", children: ["Refrigerators", "Washing Machines", "Air Conditioners"] },
            { name: "Kitchen Appliances", children: ["Ovens", "Blenders", "Water Purifiers"] }
          ]
        },
        {
          name: "Health & Beauty",
          subs: [
            { name: "Skincare", children: ["Face Wash", "Moisturizer", "Sunscreen", "Serum"] },
            { name: "Hair Care", children: ["Shampoo", "Conditioner", "Hair Oil"] },
            { name: "Personal Care", children: ["Fragrances", "Deodorant", "Body Mist"] }
          ]
        },
        {
          name: "Groceries & Pets",
          subs: [
            { name: "Beverages", children: ["Tea", "Coffee", "Juices", "Soft Drinks"] },
            { name: "Cooking Essentials", children: ["Oil", "Rice", "Flour", "Spices"] },
            { name: "Pet Supplies", children: ["Cat Food", "Dog Food", "Pet Grooming"] }
          ]
        },
        {
          name: "Home & Living",
          subs: [
            { name: "Cleaning", children: ["Vacuum Cleaners", "Mops & Sweepers", "Laundry", "Cleaning Agents"] },
            { name: "Kitchen", children: ["Cookware", "Appliances", "Bakeware"] },
            { name: "Furniture", children: ["Living Room", "Bedroom", "Office"] }
          ]
        },
        {
          name: "Sports & Outdoor",
          subs: [
            { name: "Exercise", children: ["Treadmills", "Dumbbells", "Yoga Mats"] },
            { name: "Outdoor Recreation", children: ["Cycling", "Camping", "Fishing"] },
            { name: "Team Sports", children: ["Cricket", "Football", "Badminton"] }
          ]
        },
        {
          name: "Automotive & Motorbike",
          subs: [
            { name: "Car Care", children: ["Car Wash", "Interior Care", "Exterior Care"] },
            { name: "Moto Parts", children: ["Helmets", "Tires", "Engine Oil"] },
            { name: "Electronics", children: ["Car Audio", "Dash Cams", "GPS"] }
          ]
        },
        {
          name: "Watches, Bags & Jewellery",
          subs: [
            { name: "Men's Watches", children: ["Chronograph", "Digital", "Automatic"] },
            { name: "Women's Watches", children: ["Fashion", "Casual", "Business"] },
            { name: "Jewellery", children: ["Necklaces", "Earrings", "Rings"] }
          ]
        },
        {
          name: "Services",
          subs: [
            { name: "Cleaning", children: ["Deep Cleaning", "Sofa Cleaning", "Carpet Cleaning"] },
            { name: "Repair", children: ["AC Repair", "Fridge Repair", "Washing Machine Repair"] },
            { name: "Maintenance", children: ["Electrical", "Plumbing", "Painting"] }
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

      await batch.commit();
      toast({ title: "Marketplace Data Seeded", description: "Full Daraz-style 3-level categories are now live." });
    } catch (err) {
      console.error("Seeding failed:", err);
      toast({ variant: "destructive", title: "Seeding failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isAuthorized) return <div className="p-20 text-center text-muted-foreground italic uppercase tracking-widest text-[10px]">Unauthorized Session.</div>;

  const STATS = [
    { title: "Service Bookings", value: bookings?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Product Orders", value: orders?.length || 0, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Revenue (Est)", value: "৳0", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Staff", value: "8", icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Operations Hub</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time control over marketplace transactions</p>
        </div>
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold rounded-xl shadow-sm border-primary/20 text-primary">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed Daraz Hierarchy
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
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

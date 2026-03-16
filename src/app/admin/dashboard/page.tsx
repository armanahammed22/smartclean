
'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { 
  Users, 
  Database,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Calendar,
  Package,
  Wrench,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/components/providers/language-provider';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { t } = useLanguage();
  const [isSeeding, setIsSeeding] = useState(false);

  const leadsQuery = useMemoFirebase(() => db ? query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(5)) : null, [db]);
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'customers'), orderBy('name', 'asc')) : null, [db]);
  const ordersQuery = useMemoFirebase(() => db ? query(collection(db, 'orders')) : null, [db]);
  const bookingsQuery = useMemoFirebase(() => db ? query(collection(db, 'bookings')) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services')) : null, [db]);
  const subServicesQuery = useMemoFirebase(() => db ? query(collection(db, 'sub_services')) : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles')) : null, [db]);

  const { data: recentLeads } = useCollection(leadsQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: bookings } = useCollection(bookingsQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: subServices } = useCollection(subServicesQuery);
  const { data: employees } = useCollection(employeesQuery);

  const handleSeedData = () => {
    if (!db) return;
    setIsSeeding(true);
    
    const batch = writeBatch(db);

    // Main Services
    const SERVICE_DATA = [
      { id: 's_home', title: 'Home Cleaning', basePrice: 2000 },
      { id: 's_kitchen', title: 'Kitchen Cleaning', basePrice: 1500 },
      { id: 's_bathroom', title: 'Bathroom Cleaning', basePrice: 1000 },
      { id: 's_sofa', title: 'Sofa & Furniture Cleaning', basePrice: 1200 },
      { id: 's_glass', title: 'Glass & Window Cleaning', basePrice: 800 },
      { id: 's_office', title: 'Office Cleaning', basePrice: 5000 },
      { id: 's_post_const', title: 'Post Construction Cleaning', basePrice: 8000 },
      { id: 's_carpet', title: 'Carpet & Curtain Cleaning', basePrice: 1500 },
      { id: 's_outdoor', title: 'Outdoor Cleaning', basePrice: 2000 },
      { id: 's_ac', title: 'AC Services', basePrice: 1200 },
      { id: 's_electrical', title: 'Electrical Services', basePrice: 500 },
      { id: 's_plumbing', title: 'Plumbing Services', basePrice: 500 },
      { id: 's_carpentry', title: 'Carpentry Services', basePrice: 1000 },
      { id: 's_appliance', title: 'Appliance Repair', basePrice: 800 },
      { id: 's_painting', title: 'Painting Services', basePrice: 10000 },
      { id: 's_pest', title: 'Pest Control', basePrice: 2500 }
    ];

    SERVICE_DATA.forEach(s => {
      batch.set(doc(db, 'services', s.id), {
        ...s,
        status: 'Active',
        duration: 'Variable',
        createdAt: new Date().toISOString(),
        imageUrl: `https://picsum.photos/seed/${s.id}/800/600`,
        categoryId: 'Cleaning'
      });
    });

    // Sub Services
    const SUB_SERVICES = [
      { mainServiceId: 's_home', name: 'Full Home Deep Cleaning', price: 5000, duration: '6-8 hrs' },
      { mainServiceId: 's_kitchen', name: 'Kitchen Deep Cleaning', price: 2500, duration: '3 hrs' },
      { mainServiceId: 's_ac', name: 'AC Servicing', price: 1000, duration: '1.5 hrs' }
    ];

    SUB_SERVICES.forEach((sub, idx) => {
      const subId = `sub_${sub.mainServiceId}_${idx}`;
      batch.set(doc(db, 'sub_services', subId), {
        ...sub,
        id: subId,
        status: 'Active',
        description: `Professional ${sub.name} for your convenience.`,
        createdAt: new Date().toISOString()
      });
    });

    // Staff
    batch.set(doc(db, 'employee_profiles', 'emp1'), { id: 'emp1', name: 'Zayed Khan', role: 'Cleaner', status: 'Active', createdAt: new Date().toISOString() });
    batch.set(doc(db, 'roles_admins', 'gcp03WmpjROVvRdpLNsghNU4zHa2'), { uid: 'gcp03WmpjROVvRdpLNsghNU4zHa2', role: 'Bootstrap Admin' });

    batch.commit()
      .then(() => {
        toast({ title: "ERP Database Seeded" });
      })
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch',
          operation: 'write'
        }));
      })
      .finally(() => {
        setIsSeeding(false);
      });
  };

  if (isUserLoading) return <div className="p-8 text-center">{t('ops_overview')}...</div>;

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
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold shadow-sm border-primary/20 text-primary hover:bg-primary/5 transition-all rounded-xl">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed ERP Data
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all duration-300 bg-white rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className={cn("p-2.5 rounded-xl transition-colors", stat.bg, stat.color)}><stat.icon size={20} /></div>
                  <div className={cn("flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full", stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                    {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
                  { label: "Sub-Tasks", val: subServices?.length || 0, icon: Layers },
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
               View Performance Log
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

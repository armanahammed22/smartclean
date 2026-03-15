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

  const { data: recentLeads } = useCollection(leadsQuery);
  const { data: customers } = useCollection(customersQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: bookings } = useCollection(bookingsQuery);
  const { data: products } = useCollection(productsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: subServices } = useCollection(subServicesQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // 1. Categories
      const pCat = { id: 'cat1', name: 'Equipment', status: 'Active', slug: 'equipment' };
      const sCat = { id: 'scat1', name: 'Home Services', status: 'Active', slug: 'home-services' };
      batch.set(doc(db, 'product_categories', pCat.id), pCat);
      batch.set(doc(db, 'service_categories', sCat.id), sCat);

      // 2. Staff
      const emp1 = { id: 'emp1', name: 'Zayed Khan', role: 'Cleaner', status: 'Active', phone: '01711111111', email: 'zayed@smartclean.com', createdAt: new Date().toISOString() };
      batch.set(doc(db, 'employee_profiles', emp1.id), emp1);

      // 3. Products
      const product = {
        id: 'p1',
        name: 'Smart Vacuum Robot X1',
        price: 45000,
        regularPrice: 49500,
        categoryId: 'cat1',
        stockQuantity: 15,
        status: 'Active',
        brand: 'LG',
        shortDescription: 'AI-powered cleaning for all surfaces.',
        description: 'Professional grade vacuum robot with LiDAR mapping.',
        imageUrl: 'https://picsum.photos/seed/vac/600/400'
      };
      batch.set(doc(db, 'products', product.id), product);

      // 4. Mock Orders
      const order1 = {
        id: 'mock_ord_1',
        customerName: 'Rahim Ahmed',
        customerPhone: '01919000000',
        totalPrice: 45000,
        status: 'New',
        paymentMethod: 'Cash on Delivery',
        items: [{ name: 'Smart Vacuum Robot X1', quantity: 1, price: 45000 }],
        createdAt: new Date().toISOString()
      };
      batch.set(doc(db, 'orders', order1.id), order1);

      // 5. Mock Services
      const mainSrv = { id: 's1', title: 'Deep Home Cleaning', basePrice: 5000, status: 'Active', duration: '4-5 Hours', categoryId: 'scat1', description: 'Complete sanitization of your home.' };
      batch.set(doc(db, 'services', mainSrv.id), mainSrv);

      // 6. Sub Services
      const sub1 = { id: 'sub1', name: 'Kitchen Degreasing', price: 1500, mainServiceId: 's1', duration: '1 Hour', status: 'Active', description: 'Deep cleaning of kitchen grease.' };
      batch.set(doc(db, 'sub_services', sub1.id), sub1);

      await batch.commit();
      toast({ title: t('erp_data_seeded'), description: "Database populated with orders, bookings, and staff." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seed Failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading) return <div className="p-8 text-center">{t('ops_overview')}...</div>;

  const STATS = [
    { title: "Total Orders", value: orders?.length || 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", trend: "+12%", isUp: true },
    { title: "Active Products", value: products?.filter(p => p.status === 'Active').length || 0, icon: Package, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+8%", isUp: true },
    { title: "Service Bookings", value: bookings?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", trend: "+5%", isUp: true },
    { title: "Staff Count", value: customers?.length || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50", trend: "+2%", isUp: true },
  ];

  const OPERATION_KPI = [
    { label: "Products", val: products?.length || 0, icon: Package, color: 'text-blue-500' },
    { label: "Services", val: services?.length || 0, icon: Wrench, color: 'text-indigo-500' },
    { label: "Sub-Services", val: subServices?.length || 0, icon: Layers, color: 'text-emerald-500' },
    { label: "Active Staff", val: customers?.length || 0, icon: Users, color: 'text-orange-500' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('crm_overview')}</h1>
          <p className="text-muted-foreground text-sm">{t('engagement_metrics')}</p>
        </div>
        <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="gap-2 bg-white font-bold shadow-sm">
          {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
          Seed All ERP Data
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
          <CardHeader className="border-b bg-gray-50/50"><CardTitle className="text-lg font-bold">{t('leads_acquisition')}</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg font-bold relative z-10">{t('market_insights')}</CardTitle></CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="grid grid-cols-2 gap-4">
                {OPERATION_KPI.map((kpi, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">{kpi.label}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black">{kpi.val}</span>
                      <kpi.icon size={14} className="opacity-40" />
                    </div>
                  </div>
                ))}
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-12 mt-4 shadow-xl rounded-xl uppercase tracking-tighter">
               {t('view_marketing_report')}
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

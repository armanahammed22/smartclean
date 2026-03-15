
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
  Mail,
  UserCheck,
  ShoppingCart
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
  const customersQuery = useMemoFirebase(() => db ? query(collection(db, 'customers'), orderBy('name', 'asc'), limit(5)) : null, [db]);

  const { data: recentLeads } = useCollection(leadsQuery);
  const { data: recentCustomers } = useCollection(customersQuery);

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

      // 2. Brands
      const brand = { id: 'b1', name: 'SmartClean Pro', status: 'Active' };
      batch.set(doc(db, 'brands', brand.id), brand);

      // 3. Products
      const product = {
        id: 'p1',
        name: 'Smart Vacuum Robot X1',
        price: 45000,
        categoryId: 'cat1',
        brandId: 'b1',
        stockQuantity: 15,
        status: 'Active',
        imageUrl: 'https://picsum.photos/seed/vac/600/400'
      };
      batch.set(doc(db, 'products', product.id), product);

      // 4. Services
      const service = {
        id: 's1',
        title: 'Deep Home Cleaning',
        basePrice: 5000,
        categoryId: 'scat1',
        status: 'Active',
        description: 'Comprehensive professional home cleaning.',
        imageUrl: 'https://picsum.photos/seed/clean/600/400'
      };
      batch.set(doc(db, 'services', service.id), service);

      // 5. Sub-Services
      const sub1 = { id: 'sub1', name: 'Kitchen Sanitization', price: 1500, mainServiceId: 's1', duration: '1 hr' };
      const sub2 = { id: 'sub2', name: 'Bathroom Deep Clean', price: 1200, mainServiceId: 's1', duration: '1 hr' };
      batch.set(doc(db, 'sub_services', sub1.id), sub1);
      batch.set(doc(db, 'sub_services', sub2.id), sub2);

      // 6. Payment Methods
      const pm1 = { id: 'pm1', name: 'Cash on Delivery', type: 'cod', instructions: 'Pay when your package arrives.', isEnabled: true, isDefaultForProducts: true, isDefaultForServices: false };
      const pm2 = { id: 'pm2', name: 'Cash in Hand', type: 'cash', instructions: 'Pay after service completion.', isEnabled: true, isDefaultForProducts: false, isDefaultForServices: true };
      batch.set(doc(db, 'payment_methods', pm1.id), pm1);
      batch.set(doc(db, 'payment_methods', pm2.id), pm2);

      await batch.commit();
      toast({ title: t('erp_data_seeded'), description: "Database populated with initial ERP records." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Seed Failed", description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading) return <div className="p-8 text-center">{t('ops_overview')}...</div>;

  const STATS = [
    { title: t('stat_total_leads'), value: "842", icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+12.5%", isUp: true },
    { title: t('stat_active_customers'), value: "124", icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50", trend: "+8.2%", isUp: true },
    { title: t('stat_sales_volume'), value: "৳1.4M", icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+2.1%", isUp: true },
    { title: t('stat_new_inquiries'), value: "48", icon: Mail, color: "text-purple-600", bg: "bg-purple-50", trend: "+5.4%", isUp: true },
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
          {t('seed_erp_data')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all duration-300 bg-white">
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
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader><CardTitle className="text-lg font-bold">{t('leads_acquisition')}</CardTitle></CardHeader>
          <CardContent className="h-[350px]">
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

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
          <CardHeader><CardTitle className="text-lg font-bold relative z-10">{t('market_insights')}</CardTitle></CardHeader>
          <CardContent className="space-y-6 relative z-10">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">{t('campaign_conversions')}</span>
                <span className="font-black text-xl">12.4%</span>
             </div>
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-sm opacity-80 font-medium">{t('capture_rate')}</span>
                <span className="font-black text-xl">842</span>
             </div>
             <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-12 mt-4 shadow-xl">
               {t('view_marketing_report')}
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

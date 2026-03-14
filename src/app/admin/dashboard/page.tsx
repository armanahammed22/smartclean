
'use client';

import React, { useState } from 'react';
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  UserPlus,
  ArrowUpRight,
  ClipboardList,
  Database,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const leadsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(5));
  }, [db]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'bookings'), orderBy('dateTime', 'desc'), limit(5));
  }, [db]);

  const { data: recentLeads, isLoading: leadsLoading } = useCollection(leadsQuery);
  const { data: recentBookings, isLoading: bookingsLoading } = useCollection(bookingsQuery);

  const handleSeedData = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);

      // Seed Leads
      const leads = [
        { name: "Rahim Ahmed", phone: "01711223344", email: "rahim@example.com", address: "Gulshan 2, Dhaka", status: "New", source: "Facebook", createdAt: new Date().toISOString() },
        { name: "Sara Islam", phone: "01811556677", email: "sara@example.com", address: "Banani Road 11", status: "Qualified", source: "Google Maps", createdAt: new Date().toISOString() },
        { name: "John Doe", phone: "01911889900", email: "john@example.com", address: "Uttara Sector 4", status: "Contacted", source: "Referral", createdAt: new Date().toISOString() },
      ];

      leads.forEach((l) => {
        const ref = doc(collection(db, 'leads'));
        batch.set(ref, l);
      });

      // Seed Employees
      const employees = [
        { name: "Karim Uddin", role: "Senior Cleaner", email: "karim@smartclean.com", phone: "01722334455", id: "emp_1" },
        { name: "Fatema Begum", role: "Deep Clean Specialist", email: "fatema@smartclean.com", phone: "01733445566", id: "emp_2" },
      ];

      employees.forEach((e) => {
        const ref = doc(db, 'employee_profiles', e.id);
        batch.set(ref, e);
      });

      // Seed Products
      const products = [
        { name: "Smart Vacuum Robot", price: 49999, category: "Equipment", stockQuantity: 15, description: "AI-powered cleaning robot", imageUrl: "https://picsum.photos/seed/vacuum/600/400" },
        { name: "Eco Cleaning Kit", price: 4500, category: "Supplies", stockQuantity: 50, description: "Biodegradable organic solutions", imageUrl: "https://picsum.photos/seed/eco/600/400" },
        { name: "Pro Steam Mop", price: 12900, category: "Equipment", stockQuantity: 8, description: "High-temp sanitizing steam mop", imageUrl: "https://picsum.photos/seed/steam/600/400" },
      ];

      products.forEach((p) => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, p);
      });

      // Seed Bookings
      const bookings = [
        { serviceId: "Home Deep Clean", customerId: "Rahim Ahmed", employeeId: "Karim Uddin", dateTime: new Date(Date.now() + 86400000).toISOString(), status: "Assigned", totalPrice: 15000 },
        { serviceId: "AC Maintenance", customerId: "Sara Islam", employeeId: "Unassigned", dateTime: new Date(Date.now() + 172800000).toISOString(), status: "Pending", totalPrice: 5000 },
      ];

      bookings.forEach((b) => {
        const ref = doc(collection(db, 'bookings'));
        batch.set(ref, b);
      });

      await batch.commit();
      toast({
        title: "Success",
        description: "CRM has been seeded with realistic mock data.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error seeding data",
        description: error.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isUserLoading) return <div className="p-8 text-center">Loading authentication...</div>;
  if (!user) return <div className="p-8 text-center">Access Denied. Please log in.</div>;

  const STATS = [
    { title: "Total Leads", value: recentLeads?.length || "0", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Bookings", value: recentBookings?.length || "0", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Completed Jobs", value: "1,420", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { title: "Monthly Revenue", value: "৳2,45,000", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F9FAFB] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="gap-2 bg-white font-bold"
          >
            {isSeeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
            Seed Database
          </Button>
          <Badge variant="outline" className="bg-white px-3 py-1 hidden sm:flex">Company: Smart Clean BD</Badge>
          <Badge className="bg-primary text-white px-3 py-1">Role: Admin</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {STATS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Leads */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Recent Leads
            </CardTitle>
            <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-xs">{lead.source}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic text-sm">
                      {leadsLoading ? "Loading leads..." : "No recent leads found. Click 'Seed Database' to add some."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList size={20} className="text-primary" />
              Upcoming Bookings
            </CardTitle>
            <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.serviceId}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1">
                      <Clock size={12} /> {new Date(booking.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge className="text-[10px] uppercase font-bold">
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic text-sm">
                      {bookingsLoading ? "Loading bookings..." : "No upcoming bookings. Click 'Seed Database' to add some."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

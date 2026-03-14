
'use client';

import React from 'react';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  UserPlus,
  ArrowUpRight,
  ClipboardList
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

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

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

  if (isUserLoading) return <div className="p-8 text-center">Loading authentication...</div>;
  if (!user) return <div className="p-8 text-center">Access Denied. Please log in.</div>;

  const STATS = [
    { title: "Total Leads", value: "124", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Bookings", value: "12", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
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
          <Badge variant="outline" className="bg-white px-3 py-1">Company: Smart Clean BD</Badge>
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
                      No recent leads found.
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
                      No upcoming bookings.
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

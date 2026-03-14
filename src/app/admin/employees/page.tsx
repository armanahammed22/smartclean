
'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  Star, 
  Calendar, 
  CheckCircle2, 
  Plus,
  Search,
  MoreHorizontal
} from 'lucide-react';

export default function EmployeesPage() {
  const db = useFirestore();

  const employeesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'employee_profiles'), orderBy('name', 'asc'));
  }, [db]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning crews and employee roles</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg">
          <Plus size={18} /> Hire New Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">Loading directory...</div>
        ) : employees?.length ? (
          employees.map((staff) => (
            <Card key={staff.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
              <div className="h-2 bg-primary w-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200`} />
                  <AvatarFallback>{staff.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold">{staff.name}</CardTitle>
                  <p className="text-primary text-xs font-black uppercase tracking-wider">{staff.role}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={20} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Mail size={14} className="text-primary" />
                    {staff.email}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Phone size={14} className="text-primary" />
                    {staff.phone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Completed</p>
                    <p className="text-lg font-black text-gray-900">124</p>
                  </div>
                  <div className="text-center border-l">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Rating</p>
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <p className="text-lg font-black text-gray-900">4.9</p>
                      <Star size={14} fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold h-9 uppercase">
                    Schedule
                  </Button>
                  <Button size="sm" className="flex-1 text-[10px] font-bold h-9 uppercase">
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed text-muted-foreground italic">
            No employees found in your company directory.
          </div>
        )}
      </div>
    </div>
  );
}

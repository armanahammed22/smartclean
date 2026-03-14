
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
  MoreHorizontal,
  Loader2
} from 'lucide-react';

export default function EmployeesPage() {
  const db = useFirestore();

  const employeesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'employee_profiles'), orderBy('name', 'asc'));
  }, [db]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning crews and employee roles</p>
        </div>
        <Button className="gap-2 font-bold shadow-lg h-11">
          <Plus size={18} /> Hire New Staff
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-muted-foreground font-medium">Loading staff...</span>
          </div>
        ) : employees?.length ? (
          employees.map((staff) => (
            <Card key={staff.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
              <div className="h-1.5 bg-primary w-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-col items-center text-center gap-2 pb-2">
                <Avatar className="h-16 w-16 border-4 border-gray-50 shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{staff.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold line-clamp-1">{staff.name}</CardTitle>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                    {staff.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                    <Mail size={12} className="text-primary shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                    <Phone size={12} className="text-primary shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 py-3 border-y border-gray-50">
                  <div className="text-center">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Completed</p>
                    <p className="text-sm font-black text-gray-900">124</p>
                  </div>
                  <div className="text-center border-l">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Rating</p>
                    <div className="flex items-center justify-center gap-0.5 text-orange-500">
                      <p className="text-sm font-black text-gray-900">4.9</p>
                      <Star size={10} fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[9px] font-bold h-8 uppercase">
                    Schedule
                  </Button>
                  <Button size="sm" className="flex-1 text-[9px] font-bold h-8 uppercase">
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed text-muted-foreground italic">
            No employees found in your company directory.
          </div>
        )}
      </div>
    </div>
  );
}

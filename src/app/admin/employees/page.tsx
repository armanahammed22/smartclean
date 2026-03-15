
'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Phone, 
  Star, 
  Plus,
  Loader2,
  Trash2,
  Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function EmployeesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'employee_profiles'), orderBy('name', 'asc'));
  }, [db]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const employeeData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      status: 'Active',
      rating: 5.0,
      jobsCompleted: 0,
      createdAt: new Date().toISOString()
    };

    try {
      addDoc(collection(db, 'employee_profiles'), employeeData).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'employee_profiles', operation: 'create', requestResourceData: employeeData }));
      });
      toast({ title: "Employee Hired", description: `${employeeData.name} has been added to the crew.` });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEmployee = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'employee_profiles', id)).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `employee_profiles/${id}`, operation: 'delete' }));
    });
    toast({ title: "Profile Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage cleaning crews and employee roles</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => setIsDialogOpen(true)}>
              <Plus size={18} /> Hire New Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <DialogHeader><DialogTitle>New Employee Enrollment</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" required placeholder="Employee Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required placeholder="email@smartclean.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" required placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Assigned Role</Label>
                <Select name="role" defaultValue="Cleaner">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleaner">Senior Cleaner</SelectItem>
                    <SelectItem value="Technician">AC Technician</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Manager">Operations Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Enroll Staff
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                    <p className="text-sm font-black text-gray-900">{staff.jobsCompleted || 0}</p>
                  </div>
                  <div className="text-center border-l">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Rating</p>
                    <div className="flex items-center justify-center gap-0.5 text-orange-500">
                      <p className="text-sm font-black text-gray-900">{staff.rating || '5.0'}</p>
                      <Star size={10} fill="currentColor" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[9px] font-bold h-8 uppercase">
                    Schedule
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-destructive px-2" onClick={() => deleteEmployee(staff.id)}>
                    <Trash2 size={14} />
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

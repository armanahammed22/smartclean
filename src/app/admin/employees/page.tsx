'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Loader2, Save, Users, Wrench, CheckCircle2, Phone, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function EmployeesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data Queries
  const employeesQuery = useMemoFirebase(() => db ? query(collection(db, 'employee_profiles'), orderBy('name', 'asc')) : null, [db]);
  const bookingsQuery = useMemoFirebase(() => db ? query(collection(db, 'bookings')) : null, [db]);
  const servicesQuery = useMemoFirebase(() => db ? query(collection(db, 'services')) : null, [db]);

  const { data: employees, isLoading } = useCollection(employeesQuery);
  const { data: bookings } = useCollection(bookingsQuery);
  const { data: services } = useCollection(servicesQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const staffData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string || 'Active',
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'employee_profiles', editingStaff.id), staffData);
        toast({ title: "Staff Updated" });
      } else {
        await addDoc(collection(db, 'employee_profiles'), { ...staffData, rating: 5.0, jobsCompleted: 0, createdAt: new Date().toISOString() });
        toast({ title: "Staff Enrolled" });
      }
      setIsDialogOpen(false);
      setEditingStaff(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this staff profile?")) return;
    await deleteDoc(doc(db, 'employee_profiles', id));
    toast({ title: "Profile Removed" });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage roles, schedules, and field performance</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingStaff(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingStaff(null); setIsDialogOpen(true); }}>
              <Plus size={18} /> Hire New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader><DialogTitle>{editingStaff ? 'Edit Profile' : 'New Enrollment'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="name" defaultValue={editingStaff?.name} required placeholder="Employee Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="phone" defaultValue={editingStaff?.phone} required placeholder="01XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" defaultValue={editingStaff?.email} required placeholder="staff@smartclean.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Role</Label>
                  <Select name="role" defaultValue={editingStaff?.role || "Cleaner"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cleaner">Cleaner</SelectItem>
                      <SelectItem value="Technician">Technician</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingStaff?.status || "Active"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Total Staff</p>
              <h3 className="text-3xl font-black mt-1">{employees?.length || 0}</h3>
            </div>
            <Users size={40} className="opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Staff</p>
              <h3 className="text-3xl font-black mt-1">
                {employees?.filter(e => e.status === 'Active').length || 0}
              </h3>
            </div>
            <CheckCircle2 size={40} className="text-green-500 opacity-20" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Services</p>
              <h3 className="text-3xl font-black mt-1">
                {services?.filter(s => s.status === 'Active').length || 0}
              </h3>
            </div>
            <Wrench size={40} className="text-blue-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-4">Staff Member</TableHead>
                <TableHead className="font-bold">Role</TableHead>
                <TableHead className="font-bold">Contact</TableHead>
                <TableHead className="font-bold">Jobs Count</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">Loading directory...</TableCell></TableRow>
              ) : employees?.length ? (
                employees.map((staff) => {
                  const jobCount = bookings?.filter(b => b.employeeId === staff.id).length || 0;
                  return (
                    <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-gray-100 shadow-xs">
                            <AvatarImage src={`https://picsum.photos/seed/${staff.id}/100`} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{staff.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="font-bold text-gray-900 leading-tight">{staff.name}</div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase border-indigo-100 text-indigo-600 bg-indigo-50/30">{staff.role}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-bold text-gray-700 flex items-center gap-1"><Phone size={10} className="text-primary" /> {staff.phone}</div>
                          <div className="text-[9px] text-muted-foreground flex items-center gap-1"><Mail size={10} /> {staff.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-center">{jobCount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          "text-[9px] font-black uppercase",
                          staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}>
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingStaff(staff); setIsDialogOpen(true); }}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(staff.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground">No employees found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

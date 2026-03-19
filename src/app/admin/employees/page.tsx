'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Loader2, Save, Users, Wrench, CheckCircle2, Phone, Mail, GraduationCap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function EmployeesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Data Queries (Auth Guarded)
  const employeesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), orderBy('name', 'asc')) : null, [db, user]);
  const bookingsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'bookings')) : null, [db, user]);
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);

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
      skills: selectedSkills,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'employee_profiles', editingStaff.id), staffData);
        toast({ title: "Staff Updated" });
      } else {
        await addDoc(collection(db, 'employee_profiles'), { 
          ...staffData, 
          rating: 5.0, 
          jobsCompleted: 0, 
          createdAt: new Date().toISOString() 
        });
        toast({ title: "Staff Enrolled" });
      }
      setIsDialogOpen(false);
      setEditingStaff(null);
      setSelectedSkills([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Operation failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (staff: any) => {
    setEditingStaff(staff);
    setSelectedSkills(staff.skills || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Remove this staff profile?")) return;
    await deleteDoc(doc(db, 'employee_profiles', id));
    toast({ title: "Profile Removed" });
  };

  const toggleSkill = (serviceId: string) => {
    setSelectedSkills(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">Manage roles, expertise, and field performance</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingStaff(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg h-11" onClick={() => { setEditingStaff(null); setSelectedSkills([]); setIsDialogOpen(true); }}>
              <Plus size={18} /> Hire New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader><DialogTitle className="text-xl font-black uppercase">{editingStaff ? 'Edit Profile' : 'New Enrollment'}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input name="name" defaultValue={editingStaff?.name} required placeholder="Employee Name" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</Label>
                    <Input name="phone" defaultValue={editingStaff?.phone} required placeholder="01XXXXXXXXX" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input name="email" type="email" defaultValue={editingStaff?.email} required placeholder="staff@smartclean.com" className="h-11 bg-gray-50 border-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assigned Role</Label>
                    <Select name="role" defaultValue={editingStaff?.role || "Cleaner"}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleaner">Cleaner</SelectItem>
                        <SelectItem value="Technician">Technician</SelectItem>
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                    <Select name="status" defaultValue={editingStaff?.status || "Active"}>
                      <SelectTrigger className="h-11 bg-gray-50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="text-primary" size={18} />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Certified Skills</Label>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {services?.map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-lg transition-colors">
                        <Checkbox 
                          id={`skill-${service.id}`}
                          checked={selectedSkills.includes(service.id)}
                          onCheckedChange={() => toggleSkill(service.id)}
                        />
                        <label htmlFor={`skill-${service.id}`} className="text-xs font-bold cursor-pointer flex-1">
                          {service.title}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground italic px-2">Select services this technician is qualified to perform. This enables smart auto-assignment.</p>
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-8">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                  Save Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={100} /></div>
          <CardContent className="p-6 relative z-10">
            <p className="text-primary-foreground/80 text-xs font-bold uppercase tracking-wider">Total Force</p>
            <h3 className="text-4xl font-black mt-1">{employees?.length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Field Staff</p>
              <h3 className="text-3xl font-black mt-1">
                {employees?.filter(e => e.status === 'Active').length || 0}
              </h3>
            </div>
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl"><CheckCircle2 size={32} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Expertise Coverage</p>
              <h3 className="text-3xl font-black mt-1">
                {new Set(employees?.flatMap(e => e.skills || [])).size} / {services?.length || 0}
              </h3>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Wrench size={32} /></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8">Staff Member</TableHead>
                <TableHead className="font-bold">Role & Expertise</TableHead>
                <TableHead className="font-bold text-center">Jobs</TableHead>
                <TableHead className="font-bold text-center">Rating</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline" /></TableCell></TableRow>
              ) : employees?.length ? (
                employees.map((staff) => {
                  const jobCount = bookings?.filter(b => b.employeeId === staff.id).length || 0;
                  return (
                    <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-xs">
                            <AvatarImage src={`https://picsum.photos/seed/${staff.id}/100`} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{staff.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <div className="font-bold text-gray-900 leading-tight uppercase text-xs">{staff.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={10} /> {staff.phone}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-indigo-100 text-indigo-600 bg-indigo-50/30 w-fit">{staff.role}</Badge>
                          <div className="flex flex-wrap gap-1">
                            {staff.skills?.slice(0, 3).map((sId: string) => (
                              <Badge key={sId} className="bg-gray-100 text-gray-600 border-none text-[8px] font-bold px-1.5 py-0 uppercase">
                                {services?.find(s => s.id === sId)?.title?.split(' ')[0] || 'Skill'}
                              </Badge>
                            ))}
                            {staff.skills?.length > 3 && <span className="text-[8px] font-bold text-muted-foreground">+{staff.skills.length - 3}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-sm text-center">{jobCount}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-sm">
                          {staff.rating?.toFixed(1) || '5.0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          "text-[9px] font-black uppercase border-none",
                          staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}>
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleOpenEdit(staff)}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5 rounded-lg" onClick={() => handleDelete(staff.id)}>
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
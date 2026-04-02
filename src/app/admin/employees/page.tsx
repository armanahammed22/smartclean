'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Loader2, 
  Save, 
  Users, 
  Wrench, 
  CheckCircle2, 
  Phone, 
  Mail, 
  GraduationCap,
  Banknote,
  Briefcase,
  FileText,
  Clock,
  Camera,
  Layers,
  X,
  Star
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmployeesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const employeesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'employee_profiles'), orderBy('name', 'asc')) : null, [db, user]);
  const servicesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'services'), orderBy('title', 'asc')) : null, [db, user]);

  const { data: employees, isLoading } = useCollection(employeesQuery);
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
      department: formData.get('department') as string,
      salaryModel: formData.get('salaryModel') as string,
      baseRate: parseFloat(formData.get('baseRate') as string) || 0,
      commissionRate: parseFloat(formData.get('commissionRate') as string) || 0,
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
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">HRM - Staff Directory</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage workforce, roles, and automated payroll models</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingStaff(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-black shadow-xl h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest text-xs">
              <Plus size={20} /> Hire New Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-[2.5rem] shadow-2xl">
            <form onSubmit={handleSave} className="flex flex-col">
              <DialogHeader className="bg-[#081621] text-white p-8">
                <DialogTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Users className="text-primary" /> {editingStaff ? 'Update Profile' : 'Staff Enrollment'}
                </DialogTitle>
                <DialogDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest mt-1">Configure identity, payroll and certified skills</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="identity" className="p-8">
                <TabsList className="bg-gray-100 p-1 rounded-xl mb-8">
                  <TabsTrigger value="identity" className="rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:text-primary">Identity</TabsTrigger>
                  <TabsTrigger value="payroll" className="rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:text-primary">Payroll & Role</TabsTrigger>
                  <TabsTrigger value="skills" className="rounded-lg gap-2 text-[10px] font-black uppercase data-[state=active]:bg-white data-[state=active]:text-primary">Skills</TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Legal Name</Label>
                      <Input name="name" defaultValue={editingStaff?.name} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Email</Label>
                      <Input name="email" type="email" defaultValue={editingStaff?.email} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Phone</Label>
                      <Input name="phone" defaultValue={editingStaff?.phone} required className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Department</Label>
                      <Select name="department" defaultValue={editingStaff?.department || "Operations"}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Operations">Operations (Field)</SelectItem>
                          <SelectItem value="Sales">Sales & Marketing</SelectItem>
                          <SelectItem value="Accounts">Accounts & Finance</SelectItem>
                          <SelectItem value="Support">Customer Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Salary Model</Label>
                      <Select name="salaryModel" defaultValue={editingStaff?.salaryModel || "monthly"}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-black text-primary uppercase text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="daily" className="font-bold text-[10px] uppercase">Daily Wage (Per Day)</SelectItem>
                          <SelectItem value="monthly" className="font-bold text-[10px] uppercase">Fixed Monthly Salary</SelectItem>
                          <SelectItem value="hybrid" className="font-bold text-[10px] uppercase">Hybrid (Base + Commission)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Rate (৳)</Label>
                        <Input name="baseRate" type="number" defaultValue={editingStaff?.baseRate} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Commission (%)</Label>
                        <Input name="commissionRate" type="number" defaultValue={editingStaff?.commissionRate} className="h-12 bg-gray-50 border-none rounded-xl font-black" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Designated Role</Label>
                      <Input name="role" defaultValue={editingStaff?.role || "Technician"} className="h-12 bg-gray-50 border-none rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Status</Label>
                      <Select name="status" defaultValue={editingStaff?.status || "Active"}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Active">Active Duty</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <GraduationCap className="text-primary" size={20} />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Certified Expertise</Label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {services?.map((service) => (
                        <div 
                          key={service.id} 
                          onClick={() => toggleSkill(service.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer group",
                            selectedSkills.includes(service.id) ? "border-primary bg-primary/5" : "border-white bg-white hover:border-primary/20"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            selectedSkills.includes(service.id) ? "bg-primary border-primary text-white" : "border-gray-200"
                          )}>
                            {selectedSkills.includes(service.id) && <CheckCircle2 size={12} strokeWidth={4} />}
                          </div>
                          <span className="text-[10px] font-bold uppercase truncate">{service.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="p-8 bg-gray-50 border-t flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold uppercase text-[10px]">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl font-black px-12 h-12 shadow-xl bg-[#081621] hover:bg-black text-white uppercase text-[10px] tracking-widest">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Sync Records</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Total Personnel</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{employees?.length || 0}</h3>
            </div>
            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:rotate-12 transition-transform duration-500"><Users size={32} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Active Field Duty</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">
                {employees?.filter(e => e.status === 'Active').length || 0}
              </h3>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-500"><CheckCircle2 size={32} /></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all border border-gray-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Payroll Volume</p>
              <h3 className="text-4xl font-black text-indigo-600 tracking-tighter">৳1.2M</h3>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:rotate-[-12deg] transition-transform duration-500"><Banknote size={32} /></div>
          </CardContent>
        </Card>
      </div>

      {/* DIRECTORY TABLE */}
      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold py-5 pl-8 uppercase text-[10px] tracking-widest">Employee</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Model & Rate</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Department</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Performance</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right pr-8 uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin inline text-primary" /></TableCell></TableRow>
              ) : employees?.length ? (
                employees.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                          <AvatarFallback className="bg-primary text-white font-black text-sm uppercase">{staff.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 uppercase text-xs truncate leading-tight mb-1">{staff.name}</p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><Phone size={10} /> {staff.phone}</span>
                            <span className="flex items-center gap-1"><Mail size={10} /> {staff.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[8px] px-2">{staff.salaryModel || 'monthly'}</Badge>
                        <p className="font-black text-gray-900 text-xs tracking-tight">৳{staff.baseRate?.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg text-gray-400 group-hover:text-primary transition-colors"><Briefcase size={12}/></div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">{staff.department || 'Operations'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[10px] font-black">{staff.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase">{staff.jobsCompleted || 0} JOBS DONE</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(
                        "text-[8px] font-black uppercase border-none px-2.5 py-1",
                        staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        {staff.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl" onClick={() => handleOpenEdit(staff)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => handleDelete(staff.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center py-20 italic text-muted-foreground font-medium uppercase text-[10px] tracking-widest">No staff records found. Recruit someone above.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

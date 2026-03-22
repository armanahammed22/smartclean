'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, UserPlus, Trash2, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const ROLES = [
  { id: 'admins', label: 'Admin', color: 'bg-red-100 text-red-700', value: 'admin' },
  { id: 'managers', label: 'Manager', color: 'bg-blue-100 text-blue-700', value: 'manager' },
  { id: 'accounts', label: 'Accounts', color: 'bg-green-100 text-green-700', value: 'accountant' },
  { id: 'order_managers', label: 'Order Manager', color: 'bg-purple-100 text-purple-700', value: 'order_manager' },
  { id: 'employees', label: 'Technician', color: 'bg-orange-100 text-orange-700', value: 'staff' }
];

export default function RoleManagementPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [targetUid, setTargetUid] = useState('');
  const [selectedRoleId, setSelectedRole] = useState('employees');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const uidFromParam = searchParams.get('uid');
    if (uidFromParam) {
      setTargetUid(uidFromParam);
    }
  }, [searchParams]);

  const adminsQuery = useMemoFirebase(() => db ? collection(db, 'roles_admins') : null, [db]);
  const managersQuery = useMemoFirebase(() => db ? collection(db, 'roles_managers') : null, [db]);
  const accountsQuery = useMemoFirebase(() => db ? collection(db, 'roles_accounts') : null, [db]);
  const orderManagersQuery = useMemoFirebase(() => db ? collection(db, 'roles_order_managers') : null, [db]);
  const employeesQuery = useMemoFirebase(() => db ? collection(db, 'roles_employees') : null, [db]);

  const { data: admins } = useCollection(adminsQuery);
  const { data: managers } = useCollection(managersQuery);
  const { data: accounts } = useCollection(accountsQuery);
  const { data: orderManagers } = useCollection(orderManagersQuery);
  const { data: employees } = useCollection(employeesQuery);

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !targetUid.trim()) return;
    setIsSubmitting(true);

    try {
      const colName = `roles_${selectedRoleId}`;
      const roleConfig = ROLES.find(r => r.id === selectedRoleId);
      
      // 1. Create Security Document
      await setDoc(doc(db, colName, targetUid.trim()), {
        uid: targetUid.trim(),
        assignedAt: new Date().toISOString(),
        role: selectedRoleId
      });

      // 2. Sync to Unified Users Document
      await updateDoc(doc(db, 'users', targetUid.trim()), {
        role: roleConfig?.value || 'customer',
        updatedAt: new Date().toISOString()
      }).catch(() => {
        console.warn("User profile not found in 'users' collection, only security role created.");
      });

      toast({ title: "Role Assigned", description: `UID granted ${roleConfig?.label} privileges.` });
      setTargetUid('');
      if (searchParams.get('uid')) router.push('/admin/roles');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Assignment Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeRole = async (colId: string, uid: string) => {
    if (!db || !confirm("Revoke this user's privileges?")) return;
    try {
      await deleteDoc(doc(db, colId, uid));
      
      // Revert user to customer in profile
      await updateDoc(doc(db, 'users', uid), {
        role: 'customer',
        updatedAt: new Date().toISOString()
      }).catch(() => {});

      toast({ title: "Role Revoked" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Revoke Failed", description: e.message });
    }
  };

  const allAssignments = [
    ...(admins?.map(a => ({ ...a, colId: 'roles_admins' })) || []),
    ...(managers?.map(a => ({ ...a, colId: 'roles_managers' })) || []),
    ...(accounts?.map(a => ({ ...a, colId: 'roles_accounts' })) || []),
    ...(orderManagers?.map(a => ({ ...a, colId: 'roles_order_managers' })) || []),
    ...(employees?.map(a => ({ ...a, colId: 'roles_employees' })) || [])
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
          <p className="text-muted-foreground text-sm">Dynamically manage platform roles and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm h-fit bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="text-primary" size={20} /> Assign New Role
            </CardTitle>
            <CardDescription>Grant permissions to a user by their Firebase UID.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User UID</Label>
                <Input 
                  value={targetUid} 
                  onChange={(e) => setTargetUid(e.target.value)} 
                  placeholder="Paste User UID here" 
                  className="h-11 bg-gray-50 border-gray-100 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-100 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black shadow-lg rounded-xl uppercase tracking-tighter">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <CardTitle className="text-lg font-bold">Authorized Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow>
                  <TableHead className="font-bold py-4 pl-8 uppercase text-[10px]">UID / Identity</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Privilege Level</TableHead>
                  <TableHead className="text-right pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAssignments.map((assign, i) => {
                  const roleConfig = ROLES.find(r => r.id === assign.colId);
                  return (
                    <TableRow key={i} className="hover:bg-gray-50/50 transition-colors group">
                      <TableCell className="font-mono text-[10px] text-gray-500 py-4 pl-8">{assign.uid}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[9px] font-black uppercase border-none", roleConfig?.color)}>
                          {roleConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeRole(assign.colId, assign.uid)}>
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allAssignments.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic">No roles explicitly assigned via dashboard.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-amber-50 rounded-2xl border border-amber-100">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl text-amber-600 shadow-sm"><ShieldAlert size={24} /></div>
          <div>
            <h4 className="font-black text-amber-900 uppercase text-xs tracking-widest">Security Protocol</h4>
            <p className="text-amber-800/70 text-sm font-medium">Role assignments are validated instantly by Firestore Security Rules. User profiles are updated automatically to reflect their new status in the Customer Directory.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Crown, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BookingAssignDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingAssignDialog({ booking, isOpen, onClose }: BookingAssignDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(booking?.assignedEmployees?.map((e: any) => e.uid) || []);
  const [teamLeaderId, setTeamLeaderId] = useState<string>(booking?.teamLeaderId || '');

  const employeesQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'employee_profiles'), orderBy('name', 'asc')) : null, [db]);
  const { data: employees, isLoading } = useCollection(employeesQuery);

  const handleToggleStaff = (id: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (teamLeaderId === id) setTeamLeaderId('');
  };

  const handleSave = async () => {
    if (!db || !booking) return;
    if (selectedStaffIds.length > 0 && !teamLeaderId) {
      toast({ variant: "destructive", title: "Team Leader Required", description: "Please nominate one leader for live tracking." });
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedEmployees = selectedStaffIds.map(id => ({
        uid: id,
        name: employees?.find(e => e.id === id)?.name || 'Unknown',
        role: id === teamLeaderId ? 'leader' : 'member'
      }));

      await updateDoc(doc(db, 'bookings', booking.id), {
        assignedEmployees,
        teamLeaderId,
        status: assignedEmployees.length > 0 ? 'Assigned' : 'New',
        updatedAt: new Date().toISOString()
      });

      toast({ title: "Team Assigned", description: "Technicians have been notified." });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update assignment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-[#081621] text-white">
          <DialogTitle className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <Users className="text-primary" /> Assign Field Team
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-8 space-y-6 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {employees?.map((staff) => (
                <div 
                  key={staff.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    selectedStaffIds.includes(staff.id) ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50/50 hover:border-primary/20"
                  )}
                  onClick={() => handleToggleStaff(staff.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs",
                      selectedStaffIds.includes(staff.id) ? "bg-primary text-white" : "bg-white text-gray-400"
                    )}>
                      {staff.name?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase">{staff.name}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">{staff.role}</p>
                    </div>
                  </div>
                  
                  {selectedStaffIds.includes(staff.id) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTeamLeaderId(staff.id); }}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        teamLeaderId === staff.id ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 hover:text-amber-500"
                      )}
                      title="Nominate as Team Leader"
                    >
                      <Crown size={18} fill={teamLeaderId === staff.id ? "currentColor" : "none"} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-gray-50 border-t">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="rounded-xl font-black px-8 shadow-xl">
            {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

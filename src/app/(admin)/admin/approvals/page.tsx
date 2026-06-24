"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { memberService } from "@/services/member.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminApprovalsPage() {
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  // 1. QUERY: Ambil Data Pending Members
  // Kita tidak perlu pagination disini karena biasanya list pending tidak sampai ribuan
  // dan Admin harus memprosesnya sampai habis (clean inbox zero).
  const { data: pendingMembers, isLoading, isError, error } = useQuery({
    queryKey: ['pendingMembers', userData?.coopId],
    queryFn: async () => {
      if (!userData?.coopId) return [];
      return await memberService.getPendingMembers(userData.coopId);
    },
    enabled: !!userData?.coopId,
  });

  // 2. MUTATION: Approve Member
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!userData?.uid || !userData?.coopId) throw new Error("Unauthorized");
      // Panggil service approveMember
      await memberService.approveMember(userId, userData.uid, userData.coopId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMembers'] });
      // Juga refresh list member aktif karena bertambah 1
      queryClient.invalidateQueries({ queryKey: ['adminMembers'] });
      toast.success("Anggota berhasil divalidasi & aktif.");
    },
    onError: (err: any) => {
      toast.error("Gagal memvalidasi: " + err.message);
    }
  });

  // 3. MUTATION: Reject Member
  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      await memberService.rejectMember(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingMembers'] });
      toast.success("Permintaan anggota ditolak.");
    },
    onError: (err: any) => {
      toast.error("Gagal menolak: " + err.message);
    }
  });

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-8 text-center text-red-500">Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Validasi Anggota</h1>
        <p className="text-sm text-zinc-500">
           Tinjau pendaftaran anggota baru. Pastikan data valid sebelum menyetujui.
        </p>
      </div>

      {/* Content */}
      {!pendingMembers || pendingMembers.length === 0 ? (
        <Card className="border-dashed bg-zinc-50/50 shadow-none py-12">
           <CardContent className="flex flex-col items-center text-center text-zinc-400 gap-2">
              <CheckCircle2 className="w-12 h-12 text-green-500/20" />
              <h3 className="text-lg font-semibold text-zinc-700">Semua Beres!</h3>
              <p className="text-sm">Tidak ada permintaan anggota baru yang perlu divalidasi saat ini.</p>
           </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
           {pendingMembers.map((member: any) => (
             <Card key={member.uid} className="overflow-hidden border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-shadow">
               <CardContent className="p-5 space-y-4">
                  {/* Profil Header */}
                  <div className="flex items-start gap-4">
                     <Avatar className="h-12 w-12 border">
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>{member.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                     </Avatar>
                     <div className="space-y-1">
                        <h3 className="font-bold text-zinc-900 line-clamp-1" title={member.fullName}>
                           {member.fullName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                           <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 h-5 px-1.5">
                              Pending
                           </Badge>
                           <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> 
                              {member.createdAt ? new Date(member.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 'Baru saja'}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Detail Info */}
                  <div className="space-y-2 text-sm bg-zinc-50 p-3 rounded-md border border-zinc-100">
                     <div className="flex items-start gap-2 text-zinc-600">
                        <User className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                        <span className="font-mono text-xs">{member.nik || 'NIK Belum diisi'}</span>
                     </div>
                     <div className="flex items-start gap-2 text-zinc-600">
                        <Phone className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                        <span>{member.phone || '-'}</span>
                     </div>
                     <div className="flex items-start gap-2 text-zinc-600">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                        <span className="line-clamp-2">{member.address || 'Alamat belum diisi'}</span>
                     </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                              <XCircle className="w-4 h-4 mr-2" /> Tolak
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                           <AlertDialogHeader>
                              <AlertDialogTitle>Tolak Pendaftaran?</AlertDialogTitle>
                              <AlertDialogDescription>
                                 Akun <b>{member.fullName}</b> akan ditolak. User harus mendaftar ulang jika ingin bergabung.
                              </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                 onClick={() => rejectMutation.mutate(member.uid)}
                                 className="bg-red-600 hover:bg-red-700"
                              >
                                 Tolak
                              </AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>

                     <Button 
                        onClick={() => approveMutation.mutate(member.uid)}
                        disabled={approveMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                     >
                        {approveMutation.isPending ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                           <>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Terima
                           </>
                        )}
                     </Button>
                  </div>
               </CardContent>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
}